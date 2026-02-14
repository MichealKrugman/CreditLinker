"""
OCR Configuration

Centralized configuration for OCR detection and recognition models.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any


@dataclass
class DetectionConfig:
    """Configuration for text detection"""
    model_name: str = "paddle"  # paddle, east, etc.
    min_confidence: float = 0.5
    device: str = "cpu"  # cpu or cuda
    batch_size: int = 1
    model_path: Optional[str] = None
    
    # Detection-specific params
    det_db_thresh: float = 0.3
    det_db_box_thresh: float = 0.6
    det_db_unclip_ratio: float = 1.5


@dataclass
class RecognitionConfig:
    """Configuration for text recognition"""
    model_name: str = "paddle"  # paddle, tesseract, etc.
    device: str = "cpu"  # cpu or cuda
    batch_size: int = 8
    model_path: Optional[str] = None
    
    # Recognition-specific params
    rec_batch_num: int = 6
    max_text_length: int = 25
    use_space_char: bool = True
    
    # Tesseract-specific (if using tesseract)
    tesseract_lang: str = "eng"
    tesseract_config: str = "--oem 3 --psm 6"


@dataclass
class OCRConfig:
    """Complete OCR configuration"""
    detection: DetectionConfig
    recognition: RecognitionConfig
    
    # Pipeline settings
    use_angle_cls: bool = True
    use_dilation: bool = False
    
    # Performance settings
    enable_mkldnn: bool = False
    use_tensorrt: bool = False
    
    def __init__(
        self,
        detector: str = "paddle",
        recognizer: str = "paddle",
        device: str = "cpu",
        **kwargs
    ):
        self.detection = DetectionConfig(
            model_name=detector,
            device=device,
            **{k: v for k, v in kwargs.items() if k.startswith('det_')}
        )
        
        self.recognition = RecognitionConfig(
            model_name=recognizer,
            device=device,
            **{k: v for k, v in kwargs.items() if k.startswith('rec_')}
        )
        
        # Set pipeline settings from kwargs
        self.use_angle_cls = kwargs.get('use_angle_cls', True)
        self.use_dilation = kwargs.get('use_dilation', False)
        self.enable_mkldnn = kwargs.get('enable_mkldnn', False)
        self.use_tensorrt = kwargs.get('use_tensorrt', False)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary"""
        return {
            'detection': self.detection.__dict__,
            'recognition': self.recognition.__dict__,
            'use_angle_cls': self.use_angle_cls,
            'use_dilation': self.use_dilation,
            'enable_mkldnn': self.enable_mkldnn,
            'use_tensorrt': self.use_tensorrt,
        }


# Predefined configurations
CONFIGS = {
    'default': OCRConfig(detector='paddle', recognizer='paddle'),
    'fast': OCRConfig(
        detector='paddle',
        recognizer='paddle',
        det_db_thresh=0.5,
        rec_batch_num=16,
    ),
    'accurate': OCRConfig(
        detector='paddle',
        recognizer='paddle',
        det_db_thresh=0.2,
        det_db_box_thresh=0.5,
        rec_batch_num=4,
    ),
    'tesseract': OCRConfig(
        detector='paddle',
        recognizer='tesseract',
    ),
}


def get_config(name: str = 'default') -> OCRConfig:
    """Get a predefined configuration"""
    if name not in CONFIGS:
        raise ValueError(f"Unknown config: {name}. Available: {list(CONFIGS.keys())}")
    return CONFIGS[name]
