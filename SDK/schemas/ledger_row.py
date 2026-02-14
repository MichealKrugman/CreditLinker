"""
Core ledger row schema - matches CreditLinker Transaction model
"""

from pydantic import BaseModel, Field, validator
from datetime import date
from typing import Optional
from enum import Enum


class TransactionType(str, Enum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"


class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class LedgerRow(BaseModel):
    """Single transaction from ledger - matches CreditLinker Transaction"""
    date: date
    description: str
    amount: float = Field(gt=0)
    type: TransactionType
    confidence: float = Field(ge=0.0, le=1.0)
    confidence_level: ConfidenceLevel
    needs_review: bool = False
    raw_ocr_data: Optional[dict] = None
    
    @validator('amount')
    def round_amount(cls, v):
        return round(v, 2)
    
    @validator('description')
    def clean_description(cls, v):
        if not v.strip():
            raise ValueError('Description required')
        return v.strip()[:200]
