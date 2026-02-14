"""
OCR Factory - Create detection and recognition instances

Factory pattern for creating OCR pipeline components.
"""

from typing import Optional, Tuple
from .config import OCRConfig
from .detection.base_detector import BaseDetector
from .recognition.base_recognizer import BaseRecognizer


class OCRFactory:
    """Factory for creating OCR pipeline components"""
    
    @staticmethod
    def create_detector(config: OCRConfig) -> BaseDetector:
        """
        Create a text detector based on configuration
        
        Args:
            config: OCR configuration
            
        Returns:
            BaseDetector instance
        """
        detector_name = config.detection.model_name.lower()
        
        if detector_name == 'paddle':
            from .detection.paddle_detector import PaddleDetector
            return PaddleDetector(config.detection)
        
        # Add more detectors here as needed
        # elif detector_name == 'east':
        #     from .detection.east_detector import EASTDetector
        #     return EASTDetector(config.detection)
        
        else:
            raise ValueError(
                f"Unknown detector: {detector_name}. "
                f"Available: paddle"
            )
    
    @staticmethod
    def create_recognizer(config: OCRConfig) -> BaseRecognizer:
        """
        Create a text recognizer based on configuration
        
        Args:
            config: OCR configuration
            
        Returns:
            BaseRecognizer instance
        """
        recognizer_name = config.recognition.model_name.lower()
        
        if recognizer_name == 'paddle':
            from .recognition.paddle_recognizer import PaddleRecognizer
            return PaddleRecognizer(config.recognition)
        
        elif recognizer_name == 'tesseract':
            from .recognition.tesseract_recognizer import TesseractRecognizer
            return TesseractRecognizer(config.recognition)
        
        # Add more recognizers here as needed
        # elif recognizer_name == 'custom':
        #     from .recognition.custom_recognizer import CustomRecognizer
        #     return CustomRecognizer(config.recognition)
        
        else:
            raise ValueError(
                f"Unknown recognizer: {recognizer_name}. "
                f"Available: paddle, tesseract"
            )
    
    @staticmethod
    def create_pipeline(config: OCRConfig) -> Tuple[BaseDetector, BaseRecognizer]:
        """
        Create complete OCR pipeline (detector + recognizer)
        
        Args:
            config: OCR configuration
            
        Returns:
            Tuple of (detector, recognizer)
        """
        detector = OCRFactory.create_detector(config)
        recognizer = OCRFactory.create_recognizer(config)
        return detector, recognizer
    
    @staticmethod
    def create_from_name(
        detector_name: str = 'paddle',
        recognizer_name: str = 'paddle',
        **kwargs
    ) -> Tuple[BaseDetector, BaseRecognizer]:
        """
        Convenience method to create pipeline from names
        
        Args:
            detector_name: Name of detector ('paddle', etc.)
            recognizer_name: Name of recognizer ('paddle', 'tesseract', etc.)
            **kwargs: Additional config parameters
            
        Returns:
            Tuple of (detector, recognizer)
        """
        config = OCRConfig(
            detector=detector_name,
            recognizer=recognizer_name,
            **kwargs
        )
        return OCRFactory.create_pipeline(config)
