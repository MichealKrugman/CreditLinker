"""
ORCHESTRATOR.PY DEFINITION
==========================

PURPOSE:
--------
Runtime dependency injection and execution manager.
Decides WHICH detection/recognition engines to use and HOW to execute them.

WHY IT EXISTS:
--------------
- Pipeline should NOT be hardcoded to specific models
- Need runtime switching between backends (TrOCR, Paddle, Tesseract)
- Support fallback chains (if TrOCR fails → try Paddle → try Tesseract)
- Enable A/B testing different models
- Support multi-tenancy (different customers → different models)

RESPONSIBILITIES:
-----------------
1. Model Registration: Register detector and recognizer implementations
2. Model Selection: Choose which models to use based on config
3. Model Loading: Load and initialize models on startup
4. Dependency Injection: Provide models to pipeline
5. Fallback Strategy: Handle model failures gracefully
6. Batch Coordination: Group requests for efficient GPU usage
7. Resource Management: GPU memory, CPU threads
8. Async Execution: Handle concurrent requests

KEY COMPONENTS:
---------------

1. MODEL REGISTRY
   Stores mapping: model_name → model_class
   
   Example:
   {
     "detectors": {
       "paddle": PaddleDetector,
       "custom": CustomDetector
     },
     "recognizers": {
       "trocr": TrOCRRecognizer,
       "paddle": PaddleRecognizer,
       "tesseract": TesseractRecognizer
     }
   }

2. MODEL INSTANCES
   Lazy-loaded instances of models
   
   Lifecycle:
   - First request: Load model into memory
   - Subsequent requests: Reuse loaded model
   - Idle timeout: Unload model to free memory
   
   Memory management:
   - Track GPU memory usage
   - Unload least-recently-used models if OOM
   - Support CPU fallback if GPU unavailable

3. FALLBACK CHAIN
   Ordered list of recognizers to try
   
   Example:
   ["trocr", "paddle", "tesseract"]
   
   Logic:
   - Try trocr first
   - If confidence < threshold OR error → try paddle
   - If still failing → try tesseract
   - If all fail → return error

4. BATCH COORDINATOR
   Groups multiple requests for batch processing
   
   Strategy:
   - Wait up to 100ms to collect batch
   - Process when batch size reaches 8 (configurable)
   - Process immediately if high-priority request
   
   Benefits:
   - Higher GPU utilization
   - Reduced per-image latency
   - Better throughput

CLASS DEFINITION:
-----------------

class Orchestrator:
    '''
    Manages model lifecycle and execution strategy.
    '''
    
    def __init__(self, config: Config):
        '''
        Initialize orchestrator with configuration.
        
        Args:
            config: SDK configuration object
        '''
        self.config = config
        self.detector_registry = {}
        self.recognizer_registry = {}
        self.loaded_models = {}
        self.fallback_chain = []
        self.batch_queue = []
    
    def register_detector(self, name: str, detector_class: Type[BaseDetector]):
        '''
        Register a detector implementation.
        
        Args:
            name: Detector identifier (e.g., "paddle")
            detector_class: Class that implements BaseDetector
        '''
    
    def register_recognizer(self, name: str, recognizer_class: Type[BaseRecognizer]):
        '''
        Register a recognizer implementation.
        
        Args:
            name: Recognizer identifier (e.g., "trocr")
            recognizer_class: Class that implements BaseRecognizer
        '''
    
    def set_fallback_chain(self, recognizers: List[str]):
        '''
        Set ordered list of recognizers for fallback.
        
        Args:
            recognizers: List of recognizer names in priority order
        '''
    
    def get_detector(self, name: Optional[str] = None) -> BaseDetector:
        '''
        Get detector instance (loads if not already loaded).
        
        Args:
            name: Detector name (uses config default if None)
        
        Returns:
            Loaded detector instance
        
        Raises:
            ModelNotFoundError: If detector not registered
        '''
    
    def get_recognizer(self, name: Optional[str] = None) -> BaseRecognizer:
        '''
        Get recognizer instance (loads if not already loaded).
        
        Args:
            name: Recognizer name (uses config default if None)
        
        Returns:
            Loaded recognizer instance
        
        Raises:
            ModelNotFoundError: If recognizer not registered
        '''
    
    def execute_with_fallback(
        self, 
        image_crops: List[np.ndarray],
        primary_recognizer: Optional[str] = None
    ) -> List[RecognitionResult]:
        '''
        Execute recognition with automatic fallback.
        
        Args:
            image_crops: List of cropped text images
            primary_recognizer: First recognizer to try (uses config default if None)
        
        Returns:
            List of recognition results
        
        Logic:
            1. Try primary recognizer
            2. For each low-confidence result:
               - Try next recognizer in fallback chain
               - Accept result if confidence improves
            3. Return best results
        '''
    
    def execute_batch(
        self,
        images: List[np.ndarray],
        detector_name: Optional[str] = None,
        recognizer_name: Optional[str] = None
    ) -> List[LedgerDocument]:
        '''
        Execute pipeline on batch of images.
        
        Args:
            images: List of input images
            detector_name: Detector to use
            recognizer_name: Recognizer to use
        
        Returns:
            List of extracted ledger documents
        
        Optimization:
            - Single detector forward pass on all images
            - Batch recognition on all detected crops
            - Parallel post-processing
        '''
    
    def unload_model(self, model_name: str):
        '''
        Unload model from memory.
        
        Args:
            model_name: Name of model to unload
        '''
    
    def get_stats(self) -> Dict:
        '''
        Get orchestrator statistics.
        
        Returns:
            {
              "loaded_models": ["trocr", "paddle_detector"],
              "gpu_memory_used_mb": 1024,
              "total_requests": 1234,
              "cache_hit_rate": 0.87
            }
        '''

FALLBACK LOGIC EXAMPLE:
-----------------------

# Configuration
fallback_chain = ["trocr", "paddle", "tesseract"]
confidence_threshold = 0.7

# Execution
results = []
for crop in image_crops:
    for recognizer_name in fallback_chain:
        recognizer = get_recognizer(recognizer_name)
        result = recognizer.recognize(crop)
        
        if result.confidence >= confidence_threshold:
            results.append(result)
            break  # Success, move to next crop
        
        # Low confidence, try next recognizer
        log.warning(f"{recognizer_name} low confidence: {result.confidence}")
    
    else:
        # All recognizers failed
        results.append(result)  # Use best available (last tried)
        log.error(f"All recognizers failed for crop")

BATCH PROCESSING EXAMPLE:
--------------------------

# Instead of:
for image in images:
    detector.detect(image)  # 10 separate GPU calls

# Do this:
detector.detect_batch(images)  # 1 GPU call, much faster

RESOURCE MANAGEMENT:
--------------------

Priority levels:
1. Real-time API requests: Process immediately
2. Batch jobs: Can wait in queue
3. Background reprocessing: Lowest priority

GPU memory allocation:
- Reserve 2GB for detector (always loaded)
- Allocate 4GB for primary recognizer (TrOCR)
- Allocate 1GB for fallback recognizer (Paddle)
- Unload models if total > 7GB

THREAD SAFETY:
--------------
- Orchestrator instance IS thread-safe
- Uses locks for model loading/unloading
- Batch queue is thread-safe
- Model instances may not be thread-safe (check per model)

INITIALIZATION EXAMPLE:
-----------------------

from sdk.core.orchestrator import Orchestrator
from sdk.core.config import Config
from sdk.ocr.detection.paddle_detector import PaddleDetector
from sdk.ocr.recognition.trocr_recognizer import TrOCRRecognizer
from sdk.ocr.recognition.paddle_recognizer import PaddleRecognizer

# Create orchestrator
config = Config.load("config.yaml")
orch = Orchestrator(config)

# Register models
orch.register_detector("paddle", PaddleDetector)
orch.register_recognizer("trocr", TrOCRRecognizer)
orch.register_recognizer("paddle", PaddleRecognizer)

# Set fallback strategy
orch.set_fallback_chain(["trocr", "paddle"])

# Models are loaded lazily on first use
detector = orch.get_detector()  # Loads paddle detector
recognizer = orch.get_recognizer()  # Loads trocr recognizer

# Use in pipeline
from sdk.core.pipeline import Pipeline
pipeline = Pipeline(orchestrator=orch)
result = pipeline.run("statement.jpg")
"""
