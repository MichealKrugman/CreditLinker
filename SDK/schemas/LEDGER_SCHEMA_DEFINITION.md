"""
LEDGER_SCHEMA.PY DEFINITION
============================

PURPOSE:
--------
Define data structures for ledger/transaction objects.
This is the CONTRACT between SDK and platform.

CORE DATA MODELS:
-----------------

class Transaction:
    '''
    Single financial transaction.
    '''
    def __init__(
        self,
        date: datetime,
        description: str,
        debit: float = 0.0,
        credit: float = 0.0,
        balance: Optional[float] = None,
        currency: str = "NGN",
        transaction_type: Optional[str] = None,
        category: Optional[str] = None,
        confidence: float = 1.0,
        metadata: Optional[Dict] = None
    ):
        self.date = date
        self.description = description
        self.debit = debit
        self.credit = credit
        self.balance = balance
        self.currency = currency
        self.transaction_type = transaction_type  # TRANSFER, WITHDRAWAL, DEPOSIT, etc.
        self.category = category  # INCOME, EXPENSE, etc.
        self.confidence = confidence  # OCR confidence for this transaction
        self.metadata = metadata or {}  # Additional info (row_number, etc.)
    
    def to_dict(self) -> Dict:
        '''Convert to dictionary for JSON serialization.'''
        return {
            "date": self.date.isoformat(),
            "description": self.description,
            "debit": self.debit,
            "credit": self.credit,
            "balance": self.balance,
            "currency": self.currency,
            "transaction_type": self.transaction_type,
            "category": self.category,
            "confidence": self.confidence,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Transaction':
        '''Create from dictionary.'''
        data['date'] = datetime.fromisoformat(data['date'])
        return cls(**data)

class LedgerPage:
    '''
    Single page of a ledger (for multi-page statements).
    '''
    def __init__(
        self,
        page_number: int,
        transactions: List[Transaction],
        metadata: Optional[Dict] = None
    ):
        self.page_number = page_number
        self.transactions = transactions
        self.metadata = metadata or {}
    
    @property
    def transaction_count(self) -> int:
        return len(self.transactions)
    
    @property
    def date_range(self) -> Tuple[datetime, datetime]:
        '''Get (start_date, end_date) for this page.'''
        dates = [t.date for t in self.transactions]
        return (min(dates), max(dates)) if dates else (None, None)
    
    def to_dict(self) -> Dict:
        return {
            "page_number": self.page_number,
            "transactions": [t.to_dict() for t in self.transactions],
            "transaction_count": self.transaction_count,
            "date_range": {
                "start": self.date_range[0].isoformat() if self.date_range[0] else None,
                "end": self.date_range[1].isoformat() if self.date_range[1] else None
            },
            "metadata": self.metadata
        }

class LedgerDocument:
    '''
    Complete ledger document (can contain multiple pages).
    '''
    def __init__(
        self,
        pages: Optional[List[LedgerPage]] = None,
        transactions: Optional[List[Transaction]] = None,
        confidence_report: Optional[ConfidenceReport] = None,
        validation_report: Optional[ValidationReport] = None,
        metadata: Optional[Dict] = None
    ):
        # Can initialize with either pages or flat transaction list
        if pages:
            self.pages = pages
            self.transactions = [t for page in pages for t in page.transactions]
        elif transactions:
            self.transactions = transactions
            self.pages = [LedgerPage(1, transactions)]
        else:
            self.transactions = []
            self.pages = []
        
        self.confidence_report = confidence_report
        self.validation_report = validation_report
        self.metadata = metadata or {}
    
    @property
    def transaction_count(self) -> int:
        return len(self.transactions)
    
    @property
    def page_count(self) -> int:
        return len(self.pages)
    
    @property
    def date_range(self) -> Tuple[datetime, datetime]:
        '''Get overall (start_date, end_date).'''
        dates = [t.date for t in self.transactions]
        return (min(dates), max(dates)) if dates else (None, None)
    
    @property
    def summary_statistics(self) -> Dict:
        '''Calculate summary statistics.'''
        total_debits = sum(t.debit for t in self.transactions)
        total_credits = sum(t.credit for t in self.transactions)
        opening_balance = self.transactions[0].balance if self.transactions else 0.0
        closing_balance = self.transactions[-1].balance if self.transactions else 0.0
        
        return {
            "total_transactions": self.transaction_count,
            "total_debits": total_debits,
            "total_credits": total_credits,
            "net_cashflow": total_credits - total_debits,
            "opening_balance": opening_balance,
            "closing_balance": closing_balance,
            "date_range": {
                "start": self.date_range[0].isoformat() if self.date_range[0] else None,
                "end": self.date_range[1].isoformat() if self.date_range[1] else None
            }
        }
    
    def to_dict(self) -> Dict:
        '''Convert to dictionary for JSON serialization.'''
        return {
            "pages": [p.to_dict() for p in self.pages],
            "transactions": [t.to_dict() for t in self.transactions],
            "transaction_count": self.transaction_count,
            "page_count": self.page_count,
            "summary_statistics": self.summary_statistics,
            "confidence_report": self.confidence_report.to_dict() if self.confidence_report else None,
            "validation_report": self.validation_report.to_dict() if self.validation_report else None,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'LedgerDocument':
        '''Create from dictionary.'''
        transactions = [Transaction.from_dict(t) for t in data.get('transactions', [])]
        return cls(transactions=transactions, metadata=data.get('metadata'))

EXAMPLE JSON OUTPUT:
--------------------

{
  "pages": [
    {
      "page_number": 1,
      "transactions": [...],
      "transaction_count": 25,
      "date_range": {
        "start": "2024-01-01T00:00:00",
        "end": "2024-01-31T00:00:00"
      }
    }
  ],
  "transactions": [
    {
      "date": "2024-01-01T00:00:00",
      "description": "Opening Balance",
      "debit": 0.0,
      "credit": 0.0,
      "balance": 50000.0,
      "currency": "NGN",
      "transaction_type": "OPENING",
      "category": null,
      "confidence": 0.95,
      "metadata": {"row_number": 1}
    },
    {
      "date": "2024-01-02T00:00:00",
      "description": "Salary Credit",
      "debit": 0.0,
      "credit": 100000.0,
      "balance": 150000.0,
      "currency": "NGN",
      "transaction_type": "SALARY",
      "category": "INCOME",
      "confidence": 0.92,
      "metadata": {"row_number": 2}
    }
  ],
  "transaction_count": 25,
  "page_count": 1,
  "summary_statistics": {
    "total_transactions": 25,
    "total_debits": 80000.0,
    "total_credits": 120000.0,
    "net_cashflow": 40000.0,
    "opening_balance": 50000.0,
    "closing_balance": 90000.0,
    "date_range": {
      "start": "2024-01-01T00:00:00",
      "end": "2024-01-31T00:00:00"
    }
  },
  "confidence_report": {
    "document_confidence": 0.87,
    "ocr_confidence": 0.92,
    "validation_score": 0.85,
    "balance_accuracy": 0.98,
    "recommendation": "MANUAL_REVIEW"
  },
  "validation_report": {
    "is_valid": true,
    "total_transactions": 25,
    "valid_transactions": 25,
    "invalid_transactions": 0,
    "errors": [],
    "warnings": [
      {
        "message": "Potential duplicate transaction",
        "transaction_index": 10,
        "severity": "WARNING"
      }
    ]
  },
  "metadata": {
    "processing_time_ms": 2345,
    "model_used": "trocr",
    "sdk_version": "1.0.0"
  }
}

USAGE EXAMPLE:
--------------

from sdk.schemas.ledger_schema import Transaction, LedgerDocument
from datetime import datetime

# Create transactions
transactions = [
    Transaction(
        date=datetime(2024, 1, 1),
        description="Opening Balance",
        balance=50000.0,
        confidence=0.95
    ),
    Transaction(
        date=datetime(2024, 1, 2),
        description="Salary Credit",
        credit=100000.0,
        balance=150000.0,
        transaction_type="SALARY",
        category="INCOME",
        confidence=0.92
    )
]

# Create document
ledger = LedgerDocument(transactions=transactions)

# Access data
print(f"Total transactions: {ledger.transaction_count}")
print(f"Net cashflow: {ledger.summary_statistics['net_cashflow']}")

# Serialize to JSON
import json
json_output = json.dumps(ledger.to_dict(), indent=2)

# Deserialize from JSON
data = json.loads(json_output)
ledger_copy = LedgerDocument.from_dict(data)

VALIDATION WITH PYDANTIC (OPTIONAL):
-------------------------------------

For stricter validation, can convert to Pydantic models:

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TransactionModel(BaseModel):
    date: datetime
    description: str = Field(min_length=1)
    debit: float = Field(ge=0.0)
    credit: float = Field(ge=0.0)
    balance: Optional[float] = Field(ge=0.0, default=None)
    currency: str = Field(default="NGN", pattern="^[A-Z]{3}$")
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "date": "2024-01-01T00:00:00",
                "description": "Salary Credit",
                "debit": 0.0,
                "credit": 100000.0,
                "balance": 150000.0,
                "currency": "NGN",
                "confidence": 0.95
            }
        }
"""
