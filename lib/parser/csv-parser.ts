import Papa from 'papaparse';

export interface RawTransaction {
  date: string;
  description: string;
  amount: string;
  type?: string; // credit/debit
  balance?: string;
}

export interface ParseResult {
  success: boolean;
  transactions: RawTransaction[];
  errors: string[];
  rowCount: number;
}

/**
 * Parse CSV file and extract transaction data
 * Handles multiple CSV formats from different banks
 */
export async function parseCSV(buffer: Buffer): Promise<ParseResult> {
  const text = buffer.toString('utf-8');
  const errors: string[] = [];
  const transactions: RawTransaction[] = [];

  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize header names to standard format
        return normalizeHeaderName(header);
      },
      complete: (results) => {
        const data = results.data as any[];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowNumber = i + 2; // +2 for header row and 0-index

          try {
            const transaction = extractTransactionFromRow(row, rowNumber);
            if (transaction) {
              transactions.push(transaction);
            }
          } catch (error) {
            errors.push(
              `Row ${rowNumber}: ${error instanceof Error ? error.message : 'Parse error'}`
            );
          }
        }

        resolve({
          success: errors.length === 0,
          transactions,
          errors,
          rowCount: data.length,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          transactions: [],
          errors: [error.message],
          rowCount: 0,
        });
      },
    });
  });
}

/**
 * Normalize header names to standard format
 * Handles variations like "Date", "Transaction Date", "Posting Date"
 */
function normalizeHeaderName(header: string): string {
  const normalized = header.toLowerCase().trim();

  // Date fields
  if (
    normalized.includes('date') ||
    normalized.includes('trans date') ||
    normalized.includes('posting date')
  ) {
    return 'date';
  }

  // Description fields
  if (
    normalized.includes('description') ||
    normalized.includes('memo') ||
    normalized.includes('details') ||
    normalized.includes('narration')
  ) {
    return 'description';
  }

  // Amount fields
  if (
    normalized.includes('amount') ||
    normalized.includes('value') ||
    normalized === 'debit' ||
    normalized === 'credit'
  ) {
    return normalized.includes('debit')
      ? 'debit'
      : normalized.includes('credit')
        ? 'credit'
        : 'amount';
  }

  // Balance fields
  if (normalized.includes('balance') || normalized.includes('running balance')) {
    return 'balance';
  }

  // Type fields
  if (normalized.includes('type') || normalized.includes('transaction type')) {
    return 'type';
  }

  return header;
}

/**
 * Extract transaction from CSV row
 * Handles both single-column amount and separate debit/credit columns
 */
function extractTransactionFromRow(
  row: Record<string, any>,
  rowNumber: number
): RawTransaction | null {
  // Check if row has required fields
  if (!row.date && !row.description) {
    return null; // Skip empty or invalid rows
  }

  if (!row.date) {
    throw new Error('Missing date field');
  }

  if (!row.description) {
    throw new Error('Missing description field');
  }

  // Handle amount - could be single column or separate debit/credit
  let amount: string;
  let type: string | undefined;

  if (row.amount) {
    // Single amount column
    amount = String(row.amount).trim();
    // Determine type from sign
    type = amount.startsWith('-') ? 'DEBIT' : 'CREDIT';
  } else if (row.debit || row.credit) {
    // Separate debit/credit columns
    if (row.debit && row.debit !== '0' && row.debit !== '') {
      amount = String(row.debit).trim();
      type = 'DEBIT';
    } else if (row.credit && row.credit !== '0' && row.credit !== '') {
      amount = String(row.credit).trim();
      type = 'CREDIT';
    } else {
      throw new Error('Both debit and credit are empty or zero');
    }
  } else {
    throw new Error('Missing amount field (expected "amount", "debit", or "credit")');
  }

  return {
    date: String(row.date).trim(),
    description: String(row.description).trim(),
    amount,
    type: type || row.type,
    balance: row.balance ? String(row.balance).trim() : undefined,
  };
}
