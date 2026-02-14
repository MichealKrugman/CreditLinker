"""
CONFIG.PY DEFINITION
====================

PURPOSE:
--------
Centralized runtime configuration for the entire SDK.
Single source of truth for all tunable parameters.

REQUIREMENTS:
-------------
1. Load from YAML or JSON file
2. Support environment variable overrides
3. Validate all values on load (fail fast)
4. Different configs for dev/staging/prod environments
5. Type-safe access (no typos in config keys)
6. Reasonable defaults for all values

CONFIGURATION STRUCTURE:
------------------------

# models.yaml
models:
  detection:
    default: "paddle"
    paddle:
      model_path: "models/paddle/det_model"
      confidence_threshold: 0.6
      use_gpu: true
      gpu_id: 0
  
  recognition:
    default: "trocr"
    trocr:
      encoder_path: "models/trocr/encoder.onnx"
      decoder_path: "models/trocr/decoder.onnx"
      vocab_path: "models/trocr/vocab.json"
      merges_path: "models/trocr/merges.txt"
      confidence_threshold: 0.7
      use_beam_search: true
      beam_width: 5
      max_sequence_length: 256
    paddle:
      model_path: "models/paddle/rec_model"
      confidence_threshold: 0.6
    tesseract:
      language: "eng"
      psm: 7  # Single line mode
      oem: 3  # Default LSTM engine

preprocessing:
  image:
    max_size: [4000, 4000]  # Max width, height
    target_size: [384, 384]  # For TrOCR
    maintain_aspect_ratio: true
    padding_color: [255, 255, 255]  # White
  
  normalization:
    pixel_mean: [0.485, 0.456, 0.406]  # ImageNet stats
    pixel_std: [0.229, 0.224, 0.225]
    scale: 255.0  # Divide by this
  
  augmentation:
    enabled: false  # Only enable for training
    denoise: true
    auto_contrast: true
    deskew: true

pipeline:
  fallback_chain: ["trocr", "paddle", "tesseract"]
  retry_on_error: true
  max_retries: 2
  timeout_seconds: 30

rules:
  currency_symbol: "₦"
  date_formats: ["DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD"]
  decimal_separator: "."
  thousands_separator: ","
  min_transaction_amount: 0.01
  max_transaction_amount: 1000000000.0

validation:
  require_balance_equation: true
  allow_duplicate_descriptions: true
  require_sequential_dates: true
  max_date_gap_days: 90

performance:
  batch_size: 8
  num_workers: 4
  gpu_device: 0
  enable_gpu: true
  max_memory_gb: 8
  cache_size_mb: 512

api:
  max_file_size_mb: 10
  max_pdf_pages: 50
  rate_limit_per_hour: 100
  enable_async: true
  job_timeout_seconds: 300

logging:
  level: "INFO"  # DEBUG, INFO, WARNING, ERROR
  log_file: "logs/sdk.log"
  log_to_console: true
  log_format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

CLASS DEFINITION:
-----------------

class Config:
    '''
    SDK configuration manager.
    '''
    
    def __init__(self):
        '''Initialize with default values.'''
        # Detection
        self.default_detector = "paddle"
        self.detection_confidence_threshold = 0.6
        
        # Recognition
        self.default_recognizer = "trocr"
        self.recognition_confidence_threshold = 0.7
        self.use_beam_search = True
        self.beam_width = 5
        self.max_sequence_length = 256
        
        # Preprocessing
        self.target_image_size = (384, 384)
        self.pixel_mean = [0.485, 0.456, 0.406]
        self.pixel_std = [0.229, 0.224, 0.225]
        
        # Pipeline
        self.fallback_chain = ["trocr", "paddle", "tesseract"]
        self.retry_on_error = True
        self.max_retries = 2
        
        # Performance
        self.batch_size = 8
        self.enable_gpu = True
        self.gpu_device = 0
        
        # Paths
        self.models_dir = "models/"
        self.cache_dir = "cache/"
        self.logs_dir = "logs/"
    
    @classmethod
    def load(cls, config_path: str) -> 'Config':
        '''
        Load configuration from file.
        
        Args:
            config_path: Path to YAML or JSON config file
        
        Returns:
            Config instance
        
        Raises:
            ConfigError: If file invalid or missing required fields
        '''
    
    @classmethod
    def from_dict(cls, config_dict: Dict) -> 'Config':
        '''
        Create config from dictionary.
        
        Args:
            config_dict: Configuration dictionary
        
        Returns:
            Config instance
        '''
    
    def validate(self):
        '''
        Validate all configuration values.
        
        Raises:
            ConfigError: If any value is invalid
        
        Checks:
            - Paths exist
            - Thresholds in valid range [0, 1]
            - Batch size > 0
            - GPU device exists if GPU enabled
        '''
    
    def get_model_path(self, model_type: str, model_name: str) -> str:
        '''
        Get full path to model file.
        
        Args:
            model_type: "detector" or "recognizer"
            model_name: Name of model (e.g., "trocr")
        
        Returns:
            Absolute path to model file
        '''
    
    def override(self, **kwargs):
        '''
        Override config values at runtime.
        
        Args:
            **kwargs: Key-value pairs to override
        
        Example:
            config.override(
                default_recognizer="paddle",
                use_beam_search=False
            )
        '''
    
    def to_dict(self) -> Dict:
        '''Convert config to dictionary.'''
    
    def save(self, output_path: str):
        '''Save config to YAML file.'''

ENVIRONMENT VARIABLE OVERRIDES:
-------------------------------

Environment variables take precedence over config file:

SDK_DEFAULT_RECOGNIZER=paddle
SDK_USE_GPU=true
SDK_GPU_DEVICE=0
SDK_CONFIDENCE_THRESHOLD=0.8
SDK_MODELS_DIR=/mnt/models

Load with:
config = Config.load("config.yaml")
# Automatically checks environment variables

VALIDATION LOGIC:
-----------------

def validate(self):
    '''Validate configuration.'''
    
    # Check thresholds
    if not 0.0 <= self.detection_confidence_threshold <= 1.0:
        raise ConfigError("Detection threshold must be between 0 and 1")
    
    if not 0.0 <= self.recognition_confidence_threshold <= 1.0:
        raise ConfigError("Recognition threshold must be between 0 and 1")
    
    # Check paths exist
    if not os.path.exists(self.models_dir):
        raise ConfigError(f"Models directory not found: {self.models_dir}")
    
    # Check GPU availability if enabled
    if self.enable_gpu:
        import torch
        if not torch.cuda.is_available():
            warnings.warn("GPU enabled but CUDA not available, using CPU")
            self.enable_gpu = False
    
    # Check fallback chain
    valid_recognizers = ["trocr", "paddle", "tesseract"]
    for rec in self.fallback_chain:
        if rec not in valid_recognizers:
            raise ConfigError(f"Invalid recognizer in fallback chain: {rec}")
    
    # Check batch size
    if self.batch_size < 1:
        raise ConfigError("Batch size must be at least 1")

USAGE EXAMPLES:
---------------

# Load from file
config = Config.load("config.yaml")

# Load from environment
config = Config.load("config.yaml")  # Env vars auto-applied

# Create with overrides
config = Config.load("config.yaml")
config.override(use_beam_search=False, batch_size=16)

# Access values
print(f"Using recognizer: {config.default_recognizer}")
print(f"Beam search: {config.use_beam_search}")

# Get model path
trocr_encoder = config.get_model_path("recognizer", "trocr_encoder")
# Returns: "models/trocr/encoder.onnx"

# Save modified config
config.save("config_modified.yaml")

MULTI-ENVIRONMENT SUPPORT:
--------------------------

configs/
├── development.yaml    # Local dev, debug logging, small models
├── staging.yaml        # Staging server, full models
└── production.yaml     # Prod server, optimized settings

Load based on environment:
env = os.getenv("SDK_ENV", "development")
config = Config.load(f"configs/{env}.yaml")
"""
