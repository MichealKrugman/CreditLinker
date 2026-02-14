"""
Paddle Recognizer - Text recognition using PaddleOCR
"""

from typing import List, Tuple
import numpy as np
from .base_recognizer import BaseRecognizer


class PaddleRecognizer(BaseRecognizer):
    """
    Text recognizer using PaddleOCR recognition model
    """
    
    def __init__(self, config):
        """
        Initialize PaddleRecognizer
        
        Args:
            config: RecognitionConfig instance
        """
        super().__init__(config)
        self._load_model()
    
    def _load_model(self):
        """Load PaddleOCR recognition model"""
        try:
            from paddleocr import PaddleOCR
            
            # Initialize PaddleOCR with recognition only
            self.paddle_ocr = PaddleOCR(
                use_angle_cls=False,
                lang='en',
                rec_model_dir=self.config.model_path,
                use_gpu=(self.config.device == 'cuda'),
                rec_batch_num=self.config.rec_batch_num,
                max_text_length=self.config.max_text_length,
                use_space_char=self.config.use_space_char,
                show_log=False,
            )
            
        except ImportError:
            raise ImportError(
                "PaddleOCR not installed. Install with: pip install paddleocr"
            )
    
    def recognize(self, image: np.ndarray) -> Tuple[str, float]:
        """
        Recognize text using PaddleOCR
        
        Args:
            image: Cropped text region as numpy array (H, W, C)
            
        Returns:
            Tuple of (recognized_text, confidence)
        """
        # PaddleOCR expects full OCR pipeline, but we only want recognition
        # So we'll use ocr() with det=False
        result = self.paddle_ocr.ocr(image, det=False, rec=True, cls=False)
        
        if result is None or len(result) == 0 or result[0] is None:
            return "", 0.0
        
        # Extract text and confidence
        text, confidence = result[0][0]
        return text, confidence
    
    def recognize_batch(
        self,
        images: List[np.ndarray]
    ) -> List[Tuple[str, float]]:
        """
        Recognize text in multiple images (batch processing)
        
        Args:
            images: List of cropped text regions
            
        Returns:
            List of (text, confidence) tuples
        """
        results = []
        
        # Process in batches according to config
        batch_size = self.config.batch_size
        for i in range(0, len(images), batch_size):
            batch = images[i:i + batch_size]
            
            for image in batch:
                text, conf = self.recognize(image)
                results.append((text, conf))
        
        return results
    
    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for PaddleOCR recognition
        
        Args:
            image: Input image
            
        Returns:
            Preprocessed image
        """
        # PaddleOCR handles preprocessing internally
        return image
    
    def postprocess(self, text: str, confidence: float) -> Tuple[str, float]:
        """
        Postprocess recognized text
        
        Args:
            text: Raw recognized text
            confidence: Recognition confidence
            
        Returns:
            Tuple of (processed_text, confidence)
        """
        # Clean up text
        text = text.strip()
        
        # Remove extra spaces
        text = ' '.join(text.split())
        
        return text, confidence
