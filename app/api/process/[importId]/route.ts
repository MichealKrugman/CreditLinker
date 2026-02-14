import { NextRequest, NextResponse } from 'next/server';
import { processImport } from '@/lib/parser';
import { categorizeTransaction } from '@/lib/categorization/engine';
import { prisma } from '@/lib/database/prisma';
import { getBusinessId } from '@/lib/auth/session';

/**
 * POST /api/process/:importId
 * Process uploaded file and categorize transactions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { importId: string } }
) {
  try {
    const businessId = await getBusinessId();
    const { importId } = params;

    // Verify import belongs to business
    const importRecord = await prisma.import.findFirst({
      where: {
        id: importId,
        businessId,
      },
    });

    if (!importRecord) {
      return NextResponse.json(
        { success: false, error: 'Import not found' },
        { status: 404 }
      );
    }

    if (importRecord.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Import already processed' },
        { status: 400 }
      );
    }

    // Process the import (parse, normalize, deduplicate, save)
    const result = await processImport(importId);

    // Categorize all transactions from this import
    const transactions = await prisma.transaction.findMany({
      where: { importId },
      select: { id: true, description: true, type: true },
    });

    // Apply categorization
    const updates = transactions.map((t) => ({
      id: t.id,
      category: categorizeTransaction(t.description, t.type),
    }));

    // Batch update categories
    await Promise.all(
      updates.map((u) =>
        prisma.transaction.update({
          where: { id: u.id },
          data: { category: u.category },
        })
      )
    );

    return NextResponse.json({
      success: result.success,
      data: {
        importId: result.importId,
        stats: {
          ...result.stats,
          categorized: updates.length,
        },
      },
      errors: result.errors,
    });
  } catch (error) {
    console.error('Process import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
      },
      { status: 500 }
    );
  }
}
