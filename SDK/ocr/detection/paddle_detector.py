"""
Paddle Detector - Text detection using PaddleOCR
"""

from typing import List
import numpy as np
from .base_detector import BaseDetector


class PaddleDetector(BaseDetector):
    """
    Text detector using PaddleOCR detection model
    """
    
    def __init__(self, config):
        """
        Initialize PaddleDetector
        
        Args:
            config: DetectionConfig instance
        """
        super().__init__(config)
        self._load_model()
    
    def _load_model(self):
        """Load PaddleOCR detection model"""
        try:
            from paddleocr import PaddleOCR
            
            # Initialize PaddleOCR with detection only
            self.paddle_ocr = PaddleOCR(
                use_angle_cls=False,  # Only detection
                lang='en',
                det_model_dir=self.config.model_path,
                use_gpu=(self.config.device == 'cuda'),
                det_db_thresh=self.config.det_db_thresh,
                det_db_box_thresh=self.config.det_db_box_thresh,
                det_db_unclip_ratio=self.config.det_db_unclip_ratio,
                show_log=False,
            )
            
        except ImportError:
            raise ImportError(
                "PaddleOCR not installed. Install with: pip install paddleocr"
            )
    
    def detect(self, image: np.ndarray) -> List[np.ndarray]:
        """
        Detect text regions using PaddleOCR
        
        Args:
            image: Input image as numpy array (H, W, C)
            
        Returns:
            List of text boxes as numpy arrays
        """
        # PaddleOCR returns format: [[[x1,y1],[x2,y2],[x3,y3],[x4,y4]], confidence]
        # We need to extract just the boxes
        result = self.paddle_ocr.ocr(image, det=True, rec=False, cls=False)
        
        if result is None or len(result) == 0:
            return []
        
        boxes = []
        for line in result[0]:  # result[0] contains detection results
            if line is not None:
                box = np.array(line[0])  # Extract coordinates
                boxes.append(box)
        
        return boxes
    
    def detect_batch(self, images: List[np.ndarray]) -> List[List[np.ndarray]]:
        """
        Detect text regions in multiple images
        
        Args:
            images: List of input images
            
        Returns:
            List of detection results, one per image
        """
        results = []
        for image in images:
            boxes = self.detect(image)
            results.append(boxes)
        return results
    
    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for PaddleOCR detection
        
        Args:
            image: Input image
            
        Returns:
            Preprocessed image
        """
        # PaddleOCR handles preprocessing internally
        return image
    
    def postprocess(self, boxes: List[np.ndarray]) -> List[np.ndarray]:
        """
        Postprocess detected boxes
        
        Args:
            boxes: Raw detected boxes
            
        Returns:
            Processed boxes (sorted top-to-bottom, left-to-right)
        """
        if not boxes:
            return boxes
        
        # Sort boxes by vertical position (top to bottom)
        # then by horizontal position (left to right)
        boxes_with_pos = []
        for box in boxes:
            y_min = box[:, 1].min()
            x_min = box[:, 0].min()
            boxes_with_pos.append((y_min, x_min, box))
        
        boxes_with_pos.sort(key=lambda x: (x[0], x[1]))
        sorted_boxes = [box for _, _, box in boxes_with_pos]
        
        return sorted_boxes
