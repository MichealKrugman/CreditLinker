"""
LEDGER_RULES.PY DEFINITION
===========================

PURPOSE:
--------
Transform raw OCR text into structured financial transaction objects.
This is the BRIDGE between Vision (OCR) and Intelligence (scoring).

CRITICAL RESPONSIBILITY:
------------------------
Input: List of text strings from OCR (unsorted, unstructured)
Output: List of Transaction objects (validated, typed, structured)

CORE FUNCTIONS:
---------------

def parse_ledger_rows(
    text_lines: List[str],
    bounding_boxes: List[BoundingBox]
) -> List[Transaction]:
    '''
    Convert OCR text lines into structured transactions.
    
    Args:
        text_lines: Raw text from recognition
        bounding_boxes: Spatial positions of text
    
    Returns:
        List of Transaction objects
    
    Pipeline:
    1. Reconstruct table structure from spatial layout
    2. Identify column types (date, description, debit, credit, balance)
    3. Parse each row into Transaction
    4. Handle multi-line descriptions
    5. Infer missing values (balance calculation)
    6. Return structured transactions
    '''

def reconstruct_table_structure(
    text_lines: List[str],
    boxes: List[BoundingBox]
) -> List[TableRow]:
    '''
    Rebuild table structure from text + positions.
    
    Algorithm:
    1. Group texts by Y-coordinate (same row if Y within threshold)
    2. Sort texts within row by X-coordinate (left to right)
    3. Identify column boundaries (clustering X-coordinates)
    4. Assign each text to a column
    5. Return list of rows, each row = dict of {column: text}
    
    Output:
    [
      {"col_0": "01/01/2024", "col_1": "Opening Balance", "col_2": "", "col_3": "", "col_4": "50000.00"},
      {"col_0": "02/01/2024", "col_1": "Salary Credit", "col_2": "", "col_3": "100000.00", "col_4": "150000.00"},
      ...
    ]
    '''

def identify_column_types(
    rows: List[TableRow],
    header_row: Optional[TableRow] = None
) -> Dict[str, ColumnType]:
    '''
    Determine what each column represents.
    
    Args:
        rows: List of table rows
        header_row: Optional header row (e.g., "Date | Description | Debit | Credit | Balance")
    
    Returns:
        {"col_0": "DATE", "col_1": "DESCRIPTION", "col_2": "DEBIT", "col_3": "CREDIT", "col_4": "BALANCE"}
    
    Detection logic:
    - DATE: Contains "/" or "-", parseable as date
    - AMOUNT: Contains numbers with decimals, currency symbols
    - DESCRIPTION: Text without numbers, longer strings
    - DEBIT: Negative amounts, "Dr", in left amount column
    - CREDIT: Positive amounts, "Cr", in right amount column
    - BALANCE: Running total column
    '''

def parse_transaction_row(
    row: TableRow,
    column_mapping: Dict[str, ColumnType]
) -> Optional[Transaction]:
    '''
    Convert single table row to Transaction object.
    
    Args:
        row: Dict of column values
        column_mapping: Which column is which type
    
    Returns:
        Transaction object or None if invalid row
    
    Parsing:
    1. Extract date → parse to datetime
    2. Extract description → clean whitespace
    3. Extract debit → parse currency to float
    4. Extract credit → parse currency to float
    5. Extract balance → parse currency to float
    6. Create Transaction object
    '''

def parse_currency(text: str) -> Optional[float]:
    '''
    Parse currency string to float.
    
    Examples:
    "₦1,234.56" → 1234.56
    "(500.00)" → -500.00  # Parentheses = negative
    "1,234.56 Dr" → -1234.56
    "1,234.56 Cr" → 1234.56
    "1234.56-" → -1234.56
    
    Steps:
    1. Remove currency symbols (₦, $, £)
    2. Remove thousands separators (,)
    3. Handle parentheses (negative)
    4. Handle Dr/Cr suffixes
    5. Parse to float
    '''

def parse_date(text: str, formats: List[str]) -> Optional[datetime]:
    '''
    Parse date string to datetime.
    
    Args:
        text: Date string
        formats: List of formats to try
    
    Returns:
        datetime object or None
    
    Supported formats:
    - DD/MM/YYYY
    - DD-MM-YYYY
    - YYYY-MM-DD
    - DD MMM YYYY (e.g., "01 Jan 2024")
    - DD/MM/YY (assume 20YY)
    
    Error handling:
    - Try each format in order
    - Return None if all fail
    '''

def handle_multiline_descriptions(
    rows: List[TableRow],
    column_mapping: Dict[str, ColumnType]
) -> List[TableRow]:
    '''
    Merge multi-line descriptions into single transaction.
    
    Detection:
    - Row has description but no date → continuation of previous
    - Row has description but no amounts → continuation
    
    Action:
    - Append description to previous row
    - Remove continuation row
    
    Example:
    Row 1: Date="01/01/2024", Desc="Transfer to", Debit="1000"
    Row 2: Date="", Desc="John Smith Account", Debit=""
    
    Result:
    Row 1: Date="01/01/2024", Desc="Transfer to John Smith Account", Debit="1000"
    '''

def infer_missing_balances(
    transactions: List[Transaction]
) -> List[Transaction]:
    '''
    Calculate missing balance values.
    
    Formula:
    Balance[i] = Balance[i-1] + Credit[i] - Debit[i]
    
    If first balance missing:
    - Use first available balance
    - Work backwards to calculate opening
    
    If middle balances missing:
    - Interpolate using known balances
    '''

def classify_transaction_type(
    description: str,
    debit: float,
    credit: float
) -> TransactionType:
    '''
    Classify transaction type from description and amounts.
    
    Types:
    - TRANSFER: "Transfer", "NEFT", "IMPS", "UPI"
    - WITHDRAWAL: "ATM", "Cash Withdrawal", has debit
    - DEPOSIT: "Cash Deposit", "Cheque", has credit
    - SALARY: "Salary", "Wages", large credit
    - BILL_PAYMENT: "Bill", "Electricity", "Water"
    - PURCHASE: "POS", "Card", has debit
    - FEE: "Charges", "Fee", small debit
    
    Returns:
    TransactionType enum
    '''

COLUMN DETECTION EXAMPLES:
--------------------------

Example 1: Standard 5-column layout
Date | Description | Debit | Credit | Balance
01/01 | Opening    |       |        | 50000
02/01 | Salary     |       | 10000  | 60000

Detected mapping:
{"col_0": "DATE", "col_1": "DESCRIPTION", "col_2": "DEBIT", "col_3": "CREDIT", "col_4": "BALANCE"}

Example 2: 3-column layout (no balance)
Date | Description | Amount
01/01 | Debit Purchase | -1000
02/01 | Credit Salary  | +5000

Detected mapping:
{"col_0": "DATE", "col_1": "DESCRIPTION", "col_2": "AMOUNT"}

Example 3: Merged debit/credit column
Date | Description | Debit | Credit
01/01 | Purchase   | 1000  |
02/01 | Salary     |       | 5000

Detected mapping:
{"col_0": "DATE", "col_1": "DESCRIPTION", "col_2": "DEBIT", "col_3": "CREDIT"}

CURRENCY PARSING EDGE CASES:
-----------------------------

Input: "₦1,234,567.89"
Output: 1234567.89

Input: "(500.00)"  # Parentheses notation
Output: -500.00

Input: "1,234.56 Dr"  # Debit notation
Output: -1234.56

Input: "1,234.56 Cr"  # Credit notation
Output: 1234.56

Input: "1234.56-"  # Trailing minus
Output: -1234.56

Input: "USD 1,234.56"
Output: 1234.56  # Ignore currency code

DATE PARSING EDGE CASES:
-------------------------

Input: "01/01/2024"
Output: datetime(2024, 1, 1)

Input: "01-Jan-2024"
Output: datetime(2024, 1, 1)

Input: "2024-01-01"
Output: datetime(2024, 1, 1)

Input: "01/01/24"  # Assume 2024
Output: datetime(2024, 1, 1)

Input: "32/01/2024"  # Invalid
Output: None

USAGE EXAMPLE:
--------------

from sdk.rules_engine.ledger_rules import parse_ledger_rows

# OCR output
text_lines = [
    "01/01/2024", "Opening Balance", "", "", "50000.00",
    "02/01/2024", "Salary Credit", "", "10000.00", "60000.00",
    "03/01/2024", "ATM Withdrawal", "2000.00", "", "58000.00"
]

bounding_boxes = [...]  # Spatial positions

# Parse to transactions
transactions = parse_ledger_rows(text_lines, bounding_boxes)

for txn in transactions:
    print(f"{txn.date}: {txn.description} - Dr: {txn.debit}, Cr: {txn.credit}, Bal: {txn.balance}")

OUTPUT:
2024-01-01: Opening Balance - Dr: 0.00, Cr: 0.00, Bal: 50000.00
2024-01-02: Salary Credit - Dr: 0.00, Cr: 10000.00, Bal: 60000.00
2024-01-03: ATM Withdrawal - Dr: 2000.00, Cr: 0.00, Bal: 58000.00
"""
