"""
Base Detector - Abstract interface for text detection
"""

from abc import ABC, abstractmethod
from typing import List, Tuple
import numpy as np


class BaseDetector(ABC):
    """
    Abstract base class for text detectors
    
    All detectors must implement the detect method.
    """
    
    def __init__(self, config):
        """
        Initialize detector with configuration
        
        Args:
            config: DetectionConfig instance
        """
        self.config = config
    
    @abstractmethod
    def detect(self, image: np.ndarray) -> List[np.ndarray]:
        """
        Detect text regions in an image
        
        Args:
            image: Input image as numpy array (H, W, C)
            
        Returns:
            List of text boxes, each as numpy array of shape (4, 2)
            representing 4 corner points: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
        """
        pass
    
    @abstractmethod
    def detect_batch(self, images: List[np.ndarray]) -> List[List[np.ndarray]]:
        """
        Detect text regions in multiple images
        
        Args:
            images: List of input images
            
        Returns:
            List of detection results, one per image
        """
        pass
    
    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image before detection
        
        Args:
            image: Input image
            
        Returns:
            Preprocessed image
        """
        return image
    
    def postprocess(self, boxes: List[np.ndarray]) -> List[np.ndarray]:
        """
        Postprocess detected boxes
        
        Args:
            boxes: Raw detected boxes
            
        Returns:
            Processed boxes
        """
        return boxes
    
    def filter_boxes(
        self,
        boxes: List[np.ndarray],
        min_confidence: float = None
    ) -> List[np.ndarray]:
        """
        Filter boxes by confidence threshold
        
        Args:
            boxes: Detected boxes
            min_confidence: Minimum confidence threshold
            
        Returns:
            Filtered boxes
        """
        if min_confidence is None:
            min_confidence = self.config.min_confidence
        
        # Default implementation - override in subclass if needed
        return boxes
