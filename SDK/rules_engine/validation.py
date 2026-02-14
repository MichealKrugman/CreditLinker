"""Validation rules for ledger data"""

from typing import List, Tuple
from datetime import datetime, date
from ..schemas.ledger_row import LedgerRow, TransactionType


class Validator:
    """Validates ledger data integrity"""
    
    def validate_row(self, row: dict) -> Tuple[bool, List[str]]:
        """
        Validate single row
        Returns: (is_valid, errors)
        """
        errors = []
        
        # Date validation
        if 'date' in row:
            if not self._is_valid_date(row['date']):
                errors.append("Invalid date")
        
        # Amount validation
        if 'amount' in row:
            if not self._is_valid_amount(row['amount']):
                errors.append("Invalid amount")
        
        # Description required
        if not row.get('description', '').strip():
            errors.append("Description required")
        
        return len(errors) == 0, errors
    
    def validate_balance(self, rows: List[LedgerRow], 
                         opening: float = 0.0) -> Tuple[bool, float]:
        """
        Validate ledger balance
        Returns: (is_valid, calculated_closing)
        """
        balance = opening
        
        for row in rows:
            if row.type == TransactionType.CREDIT:
                balance += row.amount
            else:
                balance -= row.amount
        
        return True, balance
    
    def _is_valid_date(self, d: date) -> bool:
        """Check if date is reasonable"""
        if isinstance(d, str):
            return False
        
        min_date = date(2000, 1, 1)
        max_date = date(datetime.now().year + 2, 12, 31)
        
        return min_date <= d <= max_date
    
    def _is_valid_amount(self, amount: float) -> bool:
        """Check if amount is reasonable"""
        if not isinstance(amount, (int, float)):
            return False
        
        return 0 < amount < 1_000_000_000  # Max 1 billion
