"""
Base Recognizer - Abstract interface for text recognition
"""

from abc import ABC, abstractmethod
from typing import List, Tuple
import numpy as np


class BaseRecognizer(ABC):
    """
    Abstract base class for text recognizers
    
    All recognizers must implement the recognize method.
    """
    
    def __init__(self, config):
        """
        Initialize recognizer with configuration
        
        Args:
            config: RecognitionConfig instance
        """
        self.config = config
    
    @abstractmethod
    def recognize(self, image: np.ndarray) -> Tuple[str, float]:
        """
        Recognize text in a cropped text region
        
        Args:
            image: Cropped text region as numpy array (H, W, C)
            
        Returns:
            Tuple of (recognized_text, confidence)
        """
        pass
    
    @abstractmethod
    def recognize_batch(
        self,
        images: List[np.ndarray]
    ) -> List[Tuple[str, float]]:
        """
        Recognize text in multiple cropped regions
        
        Args:
            images: List of cropped text regions
            
        Returns:
            List of (text, confidence) tuples
        """
        pass
    
    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image before recognition
        
        Args:
            image: Input image
            
        Returns:
            Preprocessed image
        """
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
        # Basic cleanup
        text = text.strip()
        return text, confidence
    
    def filter_by_confidence(
        self,
        results: List[Tuple[str, float]],
        min_confidence: float = 0.5
    ) -> List[Tuple[str, float]]:
        """
        Filter recognition results by confidence
        
        Args:
            results: List of (text, confidence) tuples
            min_confidence: Minimum confidence threshold
            
        Returns:
            Filtered results
        """
        return [
            (text, conf)
            for text, conf in results
            if conf >= min_confidence
        ]
