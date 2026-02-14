"""
Tesseract Recognizer - Text recognition using Tesseract OCR
"""

from typing import List, Tuple
import numpy as np
from .base_recognizer import BaseRecognizer


class TesseractRecognizer(BaseRecognizer):
    """
    Text recognizer using Tesseract OCR engine
    """
    
    def __init__(self, config):
        """
        Initialize TesseractRecognizer
        
        Args:
            config: RecognitionConfig instance
        """
        super().__init__(config)
        self._check_tesseract()
    
    def _check_tesseract(self):
        """Check if Tesseract is installed"""
        try:
            import pytesseract
            self.pytesseract = pytesseract
            
            # Test if tesseract is accessible
            try:
                pytesseract.get_tesseract_version()
            except Exception as e:
                raise RuntimeError(
                    "Tesseract not found. Install it:\n"
                    "Ubuntu/Debian: sudo apt-get install tesseract-ocr\n"
                    "macOS: brew install tesseract\n"
                    f"Error: {e}"
                )
                
        except ImportError:
            raise ImportError(
                "pytesseract not installed. Install with: pip install pytesseract"
            )
    
    def recognize(self, image: np.ndarray) -> Tuple[str, float]:
        """
        Recognize text using Tesseract
        
        Args:
            image: Cropped text region as numpy array (H, W, C)
            
        Returns:
            Tuple of (recognized_text, confidence)
        """
        try:
            # Get OCR data with confidence
            data = self.pytesseract.image_to_data(
                image,
                lang=self.config.tesseract_lang,
                config=self.config.tesseract_config,
                output_type=self.pytesseract.Output.DICT
            )
            
            # Extract text and average confidence
            texts = []
            confidences = []
            
            for i, conf in enumerate(data['conf']):
                if conf != -1:  # -1 means no text detected
                    text = data['text'][i]
                    if text.strip():
                        texts.append(text)
                        confidences.append(conf)
            
            if not texts:
                return "", 0.0
            
            # Combine texts and calculate average confidence
            full_text = ' '.join(texts)
            avg_confidence = sum(confidences) / len(confidences) / 100.0  # Normalize to 0-1
            
            return full_text, avg_confidence
            
        except Exception as e:
            print(f"Tesseract recognition error: {e}")
            return "", 0.0
    
    def recognize_batch(
        self,
        images: List[np.ndarray]
    ) -> List[Tuple[str, float]]:
        """
        Recognize text in multiple images
        
        Args:
            images: List of cropped text regions
            
        Returns:
            List of (text, confidence) tuples
        """
        results = []
        for image in images:
            text, conf = self.recognize(image)
            results.append((text, conf))
        return results
    
    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for Tesseract
        
        Args:
            image: Input image
            
        Returns:
            Preprocessed image
        """
        import cv2
        
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding for better OCR
        image = cv2.threshold(
            image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )[1]
        
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
        
        # Remove common Tesseract artifacts
        text = text.replace('|', 'I')  # Common confusion
        text = text.replace('l', 'I')  # In certain contexts
        
        return text, confidence
