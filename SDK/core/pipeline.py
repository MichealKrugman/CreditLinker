"""Main processing pipeline - orchestrates all steps"""

import time
import cv2
import numpy as np
from typing import Dict
from ..preprocessing.image_cleaner import ImageCleaner
from ..rules_engine.normalization import Normalizer
from ..rules_engine.validation import Validator
from ..rules_engine.scoring import ConfidenceScorer
from ..schemas.responses import LedgerProcessingResult
from ..schemas.ledger_row import LedgerRow, TransactionType, ConfidenceLevel


class Pipeline:
    """Main OCR processing pipeline"""
    
    def __init__(self):
        self.cleaner = ImageCleaner()
        self.normalizer = Normalizer()
        self.validator = Validator()
        self.scorer = ConfidenceScorer()
    
    async def process_ledger(self, image_path: str) -> LedgerProcessingResult:
        """
        Process ledger image end-to-end
        
        Args:
            image_path: Path to ledger image
            
        Returns:
            LedgerProcessingResult with structured transactions
        """
        start_time = time.time()
        
        # Step 1: Load and preprocess image
        image = cv2.imread(image_path)
        cleaned = self.cleaner.process(image)
        
        # Step 2: OCR (placeholder - will call PaddleOCR container)
        ocr_tokens = await self._call_ocr(cleaned)
        
        # Step 3: Reconstruct table structure
        table_data = self._reconstruct_table(ocr_tokens)
        
        # Step 4: Apply normalization
        normalized = self._normalize_rows(table_data)
        
        # Step 5: Validate
        validated = self._validate_rows(normalized)
        
        # Step 6: Score confidence
        scored = self._score_rows(validated)
        
        # Step 7: Build result
        transactions = [LedgerRow(**row) for row in scored]
        
        processing_time = (time.time() - start_time) * 1000
        stats = self.scorer.aggregate_confidence(scored)
        
        # Validate balance
        is_balanced, _ = self.validator.validate_balance(transactions)
        
        return LedgerProcessingResult(
            success=True,
            transactions=transactions,
            total_rows=stats['total'],
            high_confidence_rows=stats['high_confidence'],
            needs_review_count=stats['needs_review'],
            balance_verified=is_balanced,
            validation_errors=[],
            processing_time_ms=processing_time
        )
    
    async def _call_ocr(self, image: np.ndarray) -> list:
        """Call PaddleOCR container (placeholder)"""
        # TODO: Implement actual OCR call when PaddleOCR is forked
        return []
    
    def _reconstruct_table(self, tokens: list) -> list:
        """Reconstruct table from OCR tokens"""
        # TODO: Implement table reconstruction
        return []
    
    def _normalize_rows(self, rows: list) -> list:
        """Apply normalization rules"""
        normalized = []
        for row in rows:
            n_row = {}
            
            # Normalize date
            if 'date_text' in row:
                n_row['date'] = self.normalizer.normalize_date(row['date_text'])
            
            # Normalize amount
            if 'amount_text' in row:
                n_row['amount'] = self.normalizer.normalize_amount(row['amount_text'])
            
            # Clean description
            if 'description' in row:
                n_row['description'] = self.normalizer.clean_description(row['description'])
            
            # Infer type (placeholder)
            n_row['type'] = TransactionType.CREDIT
            
            normalized.append(n_row)
        
        return normalized
    
    def _validate_rows(self, rows: list) -> list:
        """Validate rows"""
        validated = []
        for row in rows:
            is_valid, errors = self.validator.validate_row(row)
            if is_valid:
                validated.append(row)
        return validated
    
    def _score_rows(self, rows: list) -> list:
        """Score confidence"""
        scored = []
        for row in rows:
            ocr_conf = row.get('ocr_confidence', 0.8)  # Placeholder
            conf, level, needs_review = self.scorer.score_row(row, ocr_conf)
            
            row['confidence'] = conf
            row['confidence_level'] = level
            row['needs_review'] = needs_review
            
            scored.append(row)
        
        return scored
