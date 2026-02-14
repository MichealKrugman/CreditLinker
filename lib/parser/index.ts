import { parseCSV } from './csv-parser';
import { parseExcel } from './excel-parser';
import {
  normalizeTransactions,
  deduplicateTransactions,
  NormalizedTransaction,
} from './normalizer';
import { prisma } from '@/lib/database/prisma';
import { getFile } from '@/lib/storage/minio';

export interface ProcessResult {
  success: boolean;
  importId: string;
  stats: {
    totalRows: number;
    validTransactions: number;
    duplicates: number;
    errors: number;
  };
  errors: string[];
}

/**
 * Process an uploaded file and save transactions to database
 * Main orchestrator for parsing, normalizing, and categorizing
 */
export async function processImport(importId: string): Promise<ProcessResult> {
  try {
    // Get import record
    const importRecord = await prisma.import.findUnique({
      where: { id: importId },
    });

    if (!importRecord) {
      throw new Error('Import record not found');
    }

    // Update status to processing
    await prisma.import.update({
      where: { id: importId },
      data: { status: 'PROCESSING' },
    });

    // Download file from MinIO
    const fileBuffer = await getFile(importRecord.storagePath);

    // Parse file based on type
    const parseResult =
      importRecord.fileType === 'text/csv'
        ? await parseCSV(fileBuffer)
        : await parseExcel(fileBuffer);

    if (!parseResult.success && parseResult.transactions.length === 0) {
      // Complete failure
      await prisma.import.update({
        where: { id: importId },
        data: {
          status: 'FAILED',
          errorMessage: parseResult.errors.join('; '),
          processedAt: new Date(),
        },
      });

      return {
        success: false,
        importId,
        stats: {
          totalRows: parseResult.rowCount,
          validTransactions: 0,
          duplicates: 0,
          errors: parseResult.errors.length,
        },
        errors: parseResult.errors,
      };
    }

    // Normalize transactions
    const { normalized, errors: normalizationErrors } = normalizeTransactions(
      parseResult.transactions
    );

    // Deduplicate
    const { unique, duplicates } = deduplicateTransactions(normalized);

    // Save to database
    await saveTransactions(importRecord.businessId, importId, unique);

    // Update import status
    const finalStatus = parseResult.errors.length > 0 || normalizationErrors.length > 0
      ? 'COMPLETED_WITH_ERRORS'
      : 'COMPLETED';

    await prisma.import.update({
      where: { id: importId },
      data: {
        status: finalStatus,
        processedAt: new Date(),
        errorMessage:
          [...parseResult.errors, ...normalizationErrors].join('; ') || null,
      },
    });

    return {
      success: true,
      importId,
      stats: {
        totalRows: parseResult.rowCount,
        validTransactions: unique.length,
        duplicates,
        errors: parseResult.errors.length + normalizationErrors.length,
      },
      errors: [...parseResult.errors, ...normalizationErrors],
    };
  } catch (error) {
    // Update import status to failed
    await prisma.import.update({
      where: { id: importId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date(),
      },
    });

    throw error;
  }
}

/**
 * Save normalized transactions to database
 */
async function saveTransactions(
  businessId: string,
  importId: string,
  transactions: NormalizedTransaction[]
): Promise<void> {
  // Check for existing transactions with same hash
  const existingHashes = await prisma.transaction.findMany({
    where: {
      businessId,
      hash: { in: transactions.map((t) => t.hash) },
    },
    select: { hash: true },
  });

  const existingHashSet = new Set(existingHashes.map((t) => t.hash));

  // Filter out transactions that already exist
  const newTransactions = transactions.filter(
    (t) => !existingHashSet.has(t.hash)
  );

  if (newTransactions.length === 0) {
    return; // All transactions already exist
  }

  // Batch insert
  await prisma.transaction.createMany({
    data: newTransactions.map((t) => ({
      businessId,
      importId,
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      balance: t.balance,
      hash: t.hash,
      // Category will be assigned by categorization engine
      category: null,
    })),
  });
}
