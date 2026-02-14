"""Internal data structures for processing pipeline"""

from pydantic import BaseModel
from typing import List, Tuple


class OCRToken(BaseModel):
    """Single OCR detection"""
    text: str
    confidence: float
    bbox: List[int]  # [x1, y1, x2, y2]
    

class TableCell(BaseModel):
    """Reconstructed table cell"""
    row: int
    col: int
    text: str
    confidence: float
    bbox: List[int]
