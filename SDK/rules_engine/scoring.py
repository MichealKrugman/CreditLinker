"""Confidence scoring for OCR results"""

from ..schemas.ledger_row import LedgerRow, ConfidenceLevel


class ConfidenceScorer:
    """Calculate confidence scores for transactions"""
    
    def score_row(self, row: dict, ocr_confidence: float) -> tuple:
        """
        Calculate overall confidence for a row
        Returns: (confidence_score, confidence_level, needs_review)
        """
        # Start with OCR confidence
        score = ocr_confidence
        
        # Boost if amount parsed cleanly
        if 'amount' in row and isinstance(row['amount'], float):
            score = min(1.0, score + 0.05)
        
        # Boost if date parsed successfully
        if 'date' in row:
            score = min(1.0, score + 0.05)
        
        # Penalize if description is suspicious
        if row.get('description', '').count('?') > 0:
            score = max(0.0, score - 0.1)
        
        # Determine level
        if score >= 0.9:
            level = ConfidenceLevel.HIGH
        elif score >= 0.7:
            level = ConfidenceLevel.MEDIUM
        else:
            level = ConfidenceLevel.LOW
        
        # Flag for review if low
        needs_review = score < 0.7
        
        return score, level, needs_review
    
    def aggregate_confidence(self, rows: list) -> dict:
        """Calculate aggregate statistics"""
        if not rows:
            return {
                'total': 0,
                'high_confidence': 0,
                'needs_review': 0
            }
        
        total = len(rows)
        high = sum(1 for r in rows if r.get('confidence', 0) >= 0.9)
        review = sum(1 for r in rows if r.get('needs_review', False))
        
        return {
            'total': total,
            'high_confidence': high,
            'needs_review': review
        }
