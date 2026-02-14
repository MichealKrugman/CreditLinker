"""API response schemas"""

from pydantic import BaseModel, Field
from typing import List
from .ledger_row import LedgerRow


class LedgerProcessingResult(BaseModel):
    """Complete OCR processing result"""
    success: bool
    transactions: List[LedgerRow]
    total_rows: int
    high_confidence_rows: int
    needs_review_count: int
    balance_verified: bool
    validation_errors: List[str] = Field(default_factory=list)
    processing_time_ms: float
    ocr_model_version: str = "paddle-v2.7"
    rules_version: str = "1.0"


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: str
    details: dict = None
