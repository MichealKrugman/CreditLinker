"""Data normalization - fixes OCR errors"""

import re
from datetime import datetime
from typing import Optional


class Normalizer:
    """Normalizes OCR output for Nigerian ledgers"""
    
    def normalize_amount(self, text: str) -> Optional[float]:
        """
        Parse amount from text, handling common OCR errors
        Examples: "450,000" -> 450000.0, "4S0.00" -> 450.00
        """
        if not text:
            return None
        
        # Remove currency symbols
        text = text.replace('₦', '').replace('NGN', '').strip()
        
        # Fix O/0 confusion in numbers
        text = self._fix_zero_o_confusion(text)
        
        # Remove commas
        text = text.replace(',', '')
        
        # Try to parse
        try:
            return float(text)
        except ValueError:
            return None
    
    def normalize_date(self, text: str) -> Optional[datetime]:
        """
        Parse date from various formats
        Supports: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
        """
        if not text:
            return None
        
        # Common date formats in Nigerian ledgers
        formats = [
            '%d/%m/%Y',
            '%d-%m-%Y',
            '%d.%m.%Y',
            '%d/%m/%y',
            '%d-%m-%y',
        ]
        
        text = text.strip()
        
        for fmt in formats:
            try:
                return datetime.strptime(text, fmt)
            except ValueError:
                continue
        
        return None
    
    def _fix_zero_o_confusion(self, text: str) -> str:
        """
        Fix O/0 confusion in amounts
        Rule: If surrounded by digits, it's likely 0
        """
        result = []
        for i, char in enumerate(text):
            if char.upper() == 'O':
                # Check context
                prev_digit = i > 0 and text[i-1].isdigit()
                next_digit = i < len(text)-1 and text[i+1].isdigit()
                
                if prev_digit or next_digit:
                    result.append('0')
                else:
                    result.append(char)
            elif char == 'S' and i > 0 and text[i-1].isdigit():
                # S at end of number -> 5
                result.append('5')
            elif char == 'I' and i > 0 and text[i-1].isdigit():
                # I in numbers -> 1
                result.append('1')
            else:
                result.append(char)
        
        return ''.join(result)
    
    def clean_description(self, text: str) -> str:
        """Clean transaction description"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\-\.,]', '', text)
        
        # Uppercase for consistency
        return text.upper().strip()
