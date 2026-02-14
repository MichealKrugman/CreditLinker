import * as XLSX from 'xlsx';
import { RawTransaction, ParseResult } from './csv-parser';

/**
 * Parse Excel file (.xls, .xlsx) and extract transaction data
 * Handles multiple sheets and various Excel formats
 */
export async function parseExcel(buffer: Buffer): Promise<ParseResult> {
  const errors: string[] = [];
  const transactions: RawTransaction[] = [];

  try {
    // Read the workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Use the first sheet by default
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        transactions: [],
        errors: ['No sheets found in Excel file'],
        rowCount: 0,
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false, // Get formatted values
      defval: '', // Default value for empty cells
    });

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as Record<string, any>;
      const rowNumber = i + 2; // +2 for header row and 0-index

      try {
        // Normalize the row headers
        const normalizedRow = normalizeExcelRow(row);
        const transaction = extractTransactionFromExcelRow(
          normalizedRow,
          rowNumber
        );

        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        errors.push(
          `Row ${rowNumber}: ${error instanceof Error ? error.message : 'Parse error'}`
        );
      }
    }

    return {
      success: errors.length === 0,
      transactions,
      errors,
      rowCount: jsonData.length,
    };
  } catch (error) {
    return {
      success: false,
      transactions: [],
      errors: [
        error instanceof Error ? error.message : 'Failed to parse Excel file',
      ],
      rowCount: 0,
    };
  }
}

/**
 * Normalize Excel row keys to standard format
 */
function normalizeExcelRow(row: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    const lowerKey = key.toLowerCase().trim();

    // Date fields
    if (
      lowerKey.includes('date') ||
      lowerKey.includes('trans date') ||
      lowerKey.includes('posting date')
    ) {
      normalized.date = value;
    }
    // Description fields
    else if (
      lowerKey.includes('description') ||
      lowerKey.includes('memo') ||
      lowerKey.includes('details') ||
      lowerKey.includes('narration') ||
      lowerKey.includes('particulars')
    ) {
      normalized.description = value;
    }
    // Amount fields
    else if (lowerKey === 'amount' || lowerKey === 'value') {
      normalized.amount = value;
    }
    // Debit/Credit fields
    else if (lowerKey.includes('debit') || lowerKey === 'dr') {
      normalized.debit = value;
    } else if (lowerKey.includes('credit') || lowerKey === 'cr') {
      normalized.credit = value;
    }
    // Balance fields
    else if (lowerKey.includes('balance') || lowerKey.includes('running balance')) {
      normalized.balance = value;
    }
    // Type fields
    else if (lowerKey.includes('type') || lowerKey.includes('transaction type')) {
      normalized.type = value;
    }
  }

  return normalized;
}

/**
 * Extract transaction from normalized Excel row
 */
function extractTransactionFromExcelRow(
  row: Record<string, any>,
  rowNumber: number
): RawTransaction | null {
  // Skip empty rows
  if (!row.date && !row.description) {
    return null;
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
    const debitValue = row.debit ? String(row.debit).trim() : '';
    const creditValue = row.credit ? String(row.credit).trim() : '';

    if (debitValue && debitValue !== '0' && debitValue !== '-') {
      amount = debitValue;
      type = 'DEBIT';
    } else if (creditValue && creditValue !== '0' && creditValue !== '-') {
      amount = creditValue;
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
