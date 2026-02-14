"""
CONFIDENCE.PY DEFINITION
=========================

PURPOSE:
--------
Calculate extraction confidence scores at multiple levels.
Combines OCR confidence + validation success → overall quality score.

CONFIDENCE LEVELS:
------------------
1. Character-level: Individual character recognition confidence
2. Word-level: Single recognized word confidence
3. Transaction-level: Single transaction confidence
4. Document-level: Overall extraction confidence

CORE FUNCTIONS:
---------------

def calculate_document_confidence(
    ledger: LedgerDocument
) -> float:
    '''
    Calculate overall document extraction confidence.
    
    Factors:
    - Average OCR confidence (detection + recognition)
    - Validation success rate
    - Balance equation accuracy
    - Field completeness
    
    Returns:
        Confidence score 0.0 to 1.0
    
    Formula:
    confidence = (
        0.4 * ocr_confidence +
        0.3 * validation_score +
        0.2 * balance_accuracy +
        0.1 * completeness_score
    )
    '''

def calculate_transaction_confidence(
    transaction: Transaction
) -> float:
    '''
    Calculate confidence for single transaction.
    
    Factors:
    - OCR confidence of text in this row
    - Presence of all required fields
    - Balance equation match
    - Date format validity
    - Amount format validity
    
    Returns: 0.0 to 1.0
    '''

def calculate_ocr_confidence(
    detection_confidences: List[float],
    recognition_confidences: List[float]
) -> float:
    '''
    Aggregate OCR confidence scores.
    
    Args:
        detection_confidences: Per-box detection confidence
        recognition_confidences: Per-text recognition confidence
    
    Returns:
        Combined OCR confidence
    
    Formula:
    detection_avg = mean(detection_confidences)
    recognition_avg = mean(recognition_confidences)
    ocr_confidence = (detection_avg + recognition_avg) / 2
    '''

def calculate_validation_score(
    validation_report: ValidationReport
) -> float:
    '''
    Convert validation results to confidence score.
    
    Args:
        validation_report: Validation report with errors/warnings
    
    Returns:
        Score 0.0 to 1.0
    
    Formula:
    error_penalty = len(errors) * 0.1
    warning_penalty = len(warnings) * 0.05
    score = max(0.0, 1.0 - error_penalty - warning_penalty)
    '''

def calculate_balance_accuracy(
    transactions: List[Transaction]
) -> float:
    '''
    Measure how well balances match expected values.
    
    For each transaction:
    expected_balance = prev_balance + credit - debit
    actual_balance = transaction.balance
    accuracy = 1.0 - abs(expected - actual) / expected
    
    Returns: Average accuracy across all transactions
    '''

def calculate_completeness_score(
    transaction: Transaction
) -> float:
    '''
    Measure field completeness.
    
    Required fields:
    - date (weight: 0.3)
    - description (weight: 0.2)
    - amount (debit or credit) (weight: 0.3)
    - balance (weight: 0.2)
    
    Score = sum of weights for present fields
    '''

def apply_confidence_boosting(
    base_confidence: float,
    boost_factors: Dict[str, bool]
) -> float:
    '''
    Boost confidence if certain conditions met.
    
    Boost factors:
    - perfect_balance_equation: +0.1
    - no_validation_errors: +0.1
    - all_fields_present: +0.05
    - sequential_dates: +0.05
    - standard_format_detected: +0.05
    
    Returns: Boosted confidence (capped at 1.0)
    '''

def flag_low_confidence_regions(
    transactions: List[Transaction],
    threshold: float = 0.7
) -> List[int]:
    '''
    Identify transactions with low confidence for manual review.
    
    Args:
        transactions: List of transactions
        threshold: Minimum acceptable confidence
    
    Returns:
        List of transaction indices below threshold
    '''

def create_confidence_report(
    ledger: LedgerDocument
) -> ConfidenceReport:
    '''
    Generate detailed confidence breakdown.
    
    Returns:
        ConfidenceReport with all confidence metrics
    '''

CONFIDENCE REPORT STRUCTURE:
-----------------------------

class ConfidenceReport:
    '''
    Detailed confidence analysis.
    '''
    def __init__(self):
        self.document_confidence: float = 0.0
        self.ocr_confidence: float = 0.0
        self.validation_score: float = 0.0
        self.balance_accuracy: float = 0.0
        self.completeness_score: float = 0.0
        
        self.transaction_confidences: List[float] = []
        self.low_confidence_transactions: List[int] = []
        
        self.detection_avg_confidence: float = 0.0
        self.recognition_avg_confidence: float = 0.0
        
        self.recommendation: str = ""  # AUTO_APPROVE, MANUAL_REVIEW, REJECT
    
    def to_dict(self) -> Dict:
        '''Convert to dictionary.'''
        return {
            "document_confidence": round(self.document_confidence, 3),
            "ocr_confidence": round(self.ocr_confidence, 3),
            "validation_score": round(self.validation_score, 3),
            "balance_accuracy": round(self.balance_accuracy, 3),
            "completeness_score": round(self.completeness_score, 3),
            "transaction_confidences": [round(c, 3) for c in self.transaction_confidences],
            "low_confidence_transactions": self.low_confidence_transactions,
            "recommendation": self.recommendation
        }

CONFIDENCE THRESHOLDS:
----------------------

AUTO_APPROVE: confidence >= 0.9
- High OCR confidence
- No validation errors
- Perfect balance equation
- All fields present

MANUAL_REVIEW: 0.6 <= confidence < 0.9
- Moderate OCR confidence
- Minor validation warnings
- Small balance discrepancies
- Some missing fields

REJECT: confidence < 0.6
- Low OCR confidence
- Multiple validation errors
- Large balance mismatches
- Many missing fields

CALCULATION EXAMPLES:
---------------------

Example 1: High Confidence Document

OCR confidence: 0.95
Validation score: 1.0 (no errors)
Balance accuracy: 1.0 (perfect match)
Completeness: 1.0 (all fields present)

Document confidence = 0.4*0.95 + 0.3*1.0 + 0.2*1.0 + 0.1*1.0
                    = 0.38 + 0.30 + 0.20 + 0.10
                    = 0.98

Recommendation: AUTO_APPROVE

Example 2: Medium Confidence Document

OCR confidence: 0.82
Validation score: 0.85 (2 warnings)
Balance accuracy: 0.95 (small discrepancies)
Completeness: 0.90 (some missing descriptions)

Document confidence = 0.4*0.82 + 0.3*0.85 + 0.2*0.95 + 0.1*0.90
                    = 0.328 + 0.255 + 0.19 + 0.09
                    = 0.863

Recommendation: MANUAL_REVIEW

Example 3: Low Confidence Document

OCR confidence: 0.55
Validation score: 0.40 (6 errors)
Balance accuracy: 0.70
Completeness: 0.60

Document confidence = 0.4*0.55 + 0.3*0.40 + 0.2*0.70 + 0.1*0.60
                    = 0.22 + 0.12 + 0.14 + 0.06
                    = 0.54

Recommendation: REJECT

USAGE EXAMPLE:
--------------

from sdk.rules_engine.confidence import calculate_document_confidence, create_confidence_report

# Calculate confidence
confidence = calculate_document_confidence(ledger_document)

if confidence >= 0.9:
    print("✓ High confidence - auto-approve")
elif confidence >= 0.6:
    print("⚠ Medium confidence - manual review recommended")
else:
    print("✗ Low confidence - reject or reprocess")

# Generate detailed report
report = create_confidence_report(ledger_document)

print(f"Document confidence: {report.document_confidence:.2f}")
print(f"OCR confidence: {report.ocr_confidence:.2f}")
print(f"Validation score: {report.validation_score:.2f}")

if report.low_confidence_transactions:
    print(f"Low confidence transactions: {report.low_confidence_transactions}")

# Use in scoring
if report.document_confidence < 0.7:
    # Lower financial identity score reliability
    identity_score.confidence_factor = report.document_confidence

INTEGRATION WITH PIPELINE:
--------------------------

# After validation
validation_report = validate_ledger(transactions)

# Calculate confidence
confidence_report = create_confidence_report(ledger_document)

# Store in document
ledger_document.confidence_report = confidence_report
ledger_document.overall_confidence = confidence_report.document_confidence

# Decision logic
if confidence_report.recommendation == "AUTO_APPROVE":
    # Proceed to scoring
    score = calculate_financial_identity_score(ledger_document)
elif confidence_report.recommendation == "MANUAL_REVIEW":
    # Flag for human review
    queue_for_review(ledger_document)
else:  # REJECT
    # Request better quality image or manual entry
    return Error("Extraction quality too low, please provide clearer image")
"""
