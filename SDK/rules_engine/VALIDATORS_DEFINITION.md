"""
VALIDATORS.PY DEFINITION
=========================

PURPOSE:
--------
Validate extracted transaction data for correctness and consistency.
Ensures garbage doesn't enter the scoring layer.

CORE VALIDATION FUNCTIONS:
---------------------------

def validate_ledger(
    transactions: List[Transaction]
) -> ValidationReport:
    '''
    Run all validation checks on ledger.
    
    Returns:
        ValidationReport with errors and warnings
    
    Checks performed:
    1. Date validation (format, sequence)
    2. Amount validation (non-negative, reasonable range)
    3. Balance equation
    4. Duplicate detection
    5. Missing fields
    6. Data type correctness
    '''

def validate_date_sequence(
    transactions: List[Transaction]
) -> List[ValidationError]:
    '''
    Ensure dates are in chronological order.
    
    Rules:
    - Dates must be ascending (or equal for same-day transactions)
    - No future dates (beyond today)
    - No dates before year 1900
    - No gaps > 90 days (configurable)
    
    Returns: List of errors found
    '''

def validate_balance_equation(
    transactions: List[Transaction]
) -> List[ValidationError]:
    '''
    Verify: Opening + Credits - Debits = Closing balance
    
    Formula:
    Balance[i] = Balance[i-1] + Credit[i] - Debit[i]
    
    Tolerance: Allow ±0.01 for rounding errors
    
    Returns: List of balance mismatches
    '''

def validate_amounts(
    transactions: List[Transaction],
    min_amount: float = 0.01,
    max_amount: float = 1_000_000_000.0
) -> List[ValidationError]:
    '''
    Validate transaction amounts.
    
    Checks:
    - All amounts >= 0 (debits and credits can't be negative)
    - All amounts <= max_amount (sanity check)
    - All amounts have max 2 decimal places
    - Debit and credit not both non-zero in same transaction
    
    Returns: List of amount errors
    '''

def validate_currency_format(
    amount_str: str
) -> bool:
    '''
    Validate currency string format.
    
    Valid:
    - "1234.56"
    - "₦1,234.56"
    - "(500.00)"  # Parentheses for negative
    
    Invalid:
    - "abc"
    - "12.345"  # Too many decimals
    - "12..34"  # Double decimal
    '''

def detect_duplicates(
    transactions: List[Transaction]
) -> List[ValidationWarning]:
    '''
    Detect potentially duplicate transactions.
    
    Duplicate if:
    - Same date AND same amount AND same description
    
    Note: This is a WARNING, not ERROR (legitimate duplicates exist)
    '''

def validate_required_fields(
    transaction: Transaction
) -> List[ValidationError]:
    '''
    Ensure all required fields are present.
    
    Required:
    - date (not None)
    - description (not empty string)
    - At least one of: debit, credit, balance
    
    Optional:
    - transaction_type
    - category
    '''

def validate_date_format(
    date: datetime
) -> bool:
    '''
    Validate date is reasonable.
    
    Checks:
    - Year between 1900 and current year + 1
    - Not in far future (> 1 year from today)
    - Month 1-12
    - Day valid for month
    '''

VALIDATION REPORT STRUCTURE:
-----------------------------

class ValidationReport:
    '''
    Report of all validation results.
    '''
    def __init__(self):
        self.errors: List[ValidationError] = []
        self.warnings: List[ValidationWarning] = []
        self.is_valid: bool = True
        self.total_transactions: int = 0
        self.valid_transactions: int = 0
        self.invalid_transactions: int = 0
    
    def add_error(self, error: ValidationError):
        '''Add error and mark report as invalid.'''
        self.errors.append(error)
        self.is_valid = False
    
    def add_warning(self, warning: ValidationWarning):
        '''Add warning (doesn't invalidate report).'''
        self.warnings.append(warning)
    
    def to_dict(self) -> Dict:
        '''Convert to dictionary for JSON serialization.'''
        return {
            "is_valid": self.is_valid,
            "total_transactions": self.total_transactions,
            "valid_transactions": self.valid_transactions,
            "invalid_transactions": self.invalid_transactions,
            "errors": [e.to_dict() for e in self.errors],
            "warnings": [w.to_dict() for w in self.warnings]
        }

class ValidationError:
    '''
    Single validation error.
    '''
    def __init__(
        self,
        message: str,
        transaction_index: Optional[int] = None,
        field: Optional[str] = None,
        severity: str = "ERROR"
    ):
        self.message = message
        self.transaction_index = transaction_index
        self.field = field
        self.severity = severity  # ERROR or WARNING
    
    def to_dict(self) -> Dict:
        return {
            "message": self.message,
            "transaction_index": self.transaction_index,
            "field": self.field,
            "severity": self.severity
        }

VALIDATION EXAMPLES:
--------------------

Example 1: Date sequence error
Transaction 1: 2024-01-01
Transaction 2: 2024-01-05
Transaction 3: 2024-01-03  ← Out of order!

Error:
{
  "message": "Date sequence violation: 2024-01-03 comes after 2024-01-05",
  "transaction_index": 3,
  "field": "date",
  "severity": "ERROR"
}

Example 2: Balance equation error
Transaction i-1: Balance = 50000
Transaction i: Debit = 10000, Credit = 5000, Balance = 47000

Expected: 50000 + 5000 - 10000 = 45000
Actual: 47000
Difference: 2000

Error:
{
  "message": "Balance mismatch: Expected 45000.00, got 47000.00 (diff: 2000.00)",
  "transaction_index": i,
  "field": "balance",
  "severity": "ERROR"
}

Example 3: Duplicate warning
Transaction 1: Date=2024-01-01, Amount=1000, Desc="ATM Withdrawal"
Transaction 5: Date=2024-01-01, Amount=1000, Desc="ATM Withdrawal"

Warning:
{
  "message": "Potential duplicate: Transaction 1 and 5 have identical date, amount, and description",
  "transaction_index": 5,
  "field": null,
  "severity": "WARNING"
}

USAGE EXAMPLE:
--------------

from sdk.rules_engine.validators import validate_ledger

# Run validation
report = validate_ledger(transactions)

if report.is_valid:
    print(f"✓ All {report.total_transactions} transactions are valid")
else:
    print(f"✗ Found {len(report.errors)} errors in {report.invalid_transactions} transactions")
    
    for error in report.errors:
        print(f"  - Transaction {error.transaction_index}: {error.message}")

if report.warnings:
    print(f"⚠ {len(report.warnings)} warnings:")
    for warning in report.warnings:
        print(f"  - {warning.message}")

# Convert to JSON
json_report = report.to_dict()

STRICTNESS LEVELS:
------------------

strict_mode = True:
- All errors cause validation failure
- Any balance mismatch > 0.01 is error
- Date gaps > 30 days are errors

lenient_mode = False:
- Only critical errors cause failure
- Balance mismatches < 1% are warnings
- Date gaps < 90 days are warnings
- Duplicates are warnings only

INTEGRATION WITH PIPELINE:
--------------------------

After extraction, run validation:

transactions = parse_ledger_rows(text_lines, boxes)
validation_report = validate_ledger(transactions)

if not validation_report.is_valid:
    # Option 1: Reject entire document
    raise ValidationError(f"Invalid ledger: {len(validation_report.errors)} errors")
    
    # Option 2: Filter out invalid transactions
    valid_transactions = [
        txn for i, txn in enumerate(transactions)
        if i not in [e.transaction_index for e in validation_report.errors]
    ]
    
    # Option 3: Return with warnings
    return LedgerDocument(
        transactions=transactions,
        validation_report=validation_report,
        confidence_score=0.5  # Lower confidence due to errors
    )
"""
