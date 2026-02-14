import { RawTransaction } from './csv-parser';
import { TransactionType } from '@prisma/client';

export interface NormalizedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  balance?: number;
  hash: string; // For deduplication
}

/**
 * Normalize raw transactions to standardized format
 * - Parse and validate dates
 * - Clean and parse amounts
 * - Standardize transaction types
 * - Generate deduplication hash
 */
export function normalizeTransactions(
  rawTransactions: RawTransaction[]
): {
  normalized: NormalizedTransaction[];
  errors: string[];
} {
  const normalized: NormalizedTransaction[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rawTransactions.length; i++) {
    const raw = rawTransactions[i];

    try {
      const transaction = normalizeTransaction(raw);
      normalized.push(transaction);
    } catch (error) {
      errors.push(
        `Transaction ${i + 1}: ${error instanceof Error ? error.message : 'Normalization error'}`
      );
    }
  }

  return { normalized, errors };
}

/**
 * Normalize a single transaction
 */
function normalizeTransaction(raw: RawTransaction): NormalizedTransaction {
  // Parse and validate date
  const date = parseDate(raw.date);
  if (!date) {
    throw new Error(`Invalid date format: "${raw.date}"`);
  }

  // Clean description
  const description = raw.description.trim();
  if (!description) {
    throw new Error('Description cannot be empty');
  }

  // Parse amount
  const amount = parseAmount(raw.amount);
  if (isNaN(amount) || amount === 0) {
    throw new Error(`Invalid amount: "${raw.amount}"`);
  }

  // Determine transaction type
  const type = determineTransactionType(raw.amount, raw.type);

  // Parse balance if available
  const balance = raw.balance ? parseAmount(raw.balance) : undefined;

  // Generate deduplication hash
  const hash = generateHash(date, description, amount);

  return {
    date,
    description,
    amount: Math.abs(amount), // Store as positive value
    type,
    balance,
    hash,
  };
}

/**
 * Parse date from various formats
 * Supports: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY
 */
function parseDate(dateStr: string): Date | null {
  const cleaned = dateStr.trim();

  // Try ISO format first (YYYY-MM-DD)
  let date = new Date(cleaned);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Try DD/MM/YYYY or MM/DD/YYYY format
  const parts = cleaned.split(/[\/\-\.]/);
  if (parts.length === 3) {
    // Try DD/MM/YYYY (common in many countries)
    const [first, second, third] = parts.map(Number);
    
    // If third part is 2-digit year, convert to 4-digit
    const year = third < 100 ? (third > 50 ? 1900 + third : 2000 + third) : third;
    
    // Try DD/MM/YYYY
    date = new Date(year, second - 1, first);
    if (!isNaN(date.getTime()) && date.getDate() === first) {
      return date;
    }

    // Try MM/DD/YYYY
    date = new Date(year, first - 1, second);
    if (!isNaN(date.getTime()) && date.getDate() === second) {
      return date;
    }
  }

  return null;
}

/**
 * Parse amount from string
 * Handles: 1,234.56, (1234.56), -1234.56, $1234.56, 1234.56 CR/DR
 */
function parseAmount(amountStr: string): number {
  let cleaned = amountStr.trim();

  // Remove currency symbols
  cleaned = cleaned.replace(/[$€£¥₹]/g, '');

  // Handle parentheses (accounting notation for negative)
  const isNegative = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isNegative) {
    cleaned = cleaned.slice(1, -1);
  }

  // Remove CR/DR suffixes
  cleaned = cleaned.replace(/\s*(CR|DR)$/i, '');

  // Remove thousand separators (commas)
  cleaned = cleaned.replace(/,/g, '');

  // Remove whitespace
  cleaned = cleaned.replace(/\s/g, '');

  // Parse as float
  const value = parseFloat(cleaned);

  // Apply negative if parentheses were used
  return isNegative ? -Math.abs(value) : value;
}

/**
 * Determine transaction type from amount and explicit type field
 */
function determineTransactionType(
  amountStr: string,
  explicitType?: string
): TransactionType {
  // If explicit type is provided, use it
  if (explicitType) {
    const normalized = explicitType.toUpperCase().trim();
    if (normalized === 'DEBIT' || normalized === 'DR' || normalized === 'WITHDRAWAL') {
      return 'DEBIT';
    }
    if (normalized === 'CREDIT' || normalized === 'CR' || normalized === 'DEPOSIT') {
      return 'CREDIT';
    }
  }

  // Otherwise, determine from amount
  const amount = parseAmount(amountStr);
  return amount < 0 ? 'DEBIT' : 'CREDIT';
}

/**
 * Generate hash for deduplication
 * Combines date, description, and amount
 */
function generateHash(date: Date, description: string, amount: number): string {
  const dateStr = date.toISOString().split('T')[0];
  const cleanDesc = description.toLowerCase().replace(/\s+/g, ' ').trim();
  const amountStr = amount.toFixed(2);

  const combined = `${dateStr}|${cleanDesc}|${amountStr}`;

  // Simple hash function (good enough for deduplication)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Deduplicate transactions based on hash
 * Keeps the first occurrence of each unique transaction
 */
export function deduplicateTransactions(
  transactions: NormalizedTransaction[]
): {
  unique: NormalizedTransaction[];
  duplicates: number;
} {
  const seen = new Set<string>();
  const unique: NormalizedTransaction[] = [];
  let duplicates = 0;

  for (const transaction of transactions) {
    if (!seen.has(transaction.hash)) {
      seen.add(transaction.hash);
      unique.push(transaction);
    } else {
      duplicates++;
    }
  }

  return { unique, duplicates };
}
