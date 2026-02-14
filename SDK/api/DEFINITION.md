"""
API LAYER - DEFINITION

PURPOSE:
Interface between Financial Identity platform and OCR SDK.
Ensures platform doesn't import internal OCR modules directly.

FILE STRUCTURE:
- __init__.py           : Package initialization
- routes.py            : API endpoints (FastAPI/Flask)
- models.py            : Request/response models  
- middleware.py        : Authentication, rate limiting
- errors.py            : Error handling and formatting

---

routes.py DEFINITION:
----------------------

ENDPOINTS:

POST /api/v1/extract
  - Accepts: multipart/form-data (image or PDF file)
  - Validates: file type (JPEG, PNG, PDF), file size (< 10MB)
  - Calls: core.pipeline.run(image_data)
  - Returns: schemas.LedgerDocument JSON
  - Status Codes:
    * 200: Success with ledger data
    * 400: Invalid file type/size
    * 422: Processing failed (OCR errors)
    * 500: Internal error

POST /api/v1/extract/batch
  - Accepts: List of files
  - Calls: orchestrator.process_batch(images)
  - Returns: List of LedgerDocument JSONs

GET /api/v1/health
  - Returns: Service health status
  - Checks: Models loaded, GPU available, dependencies OK

---

models.py DEFINITION:
--------------------

REQUEST MODELS:
- ExtractRequest:
    * file: UploadFile
    * options: Optional[ProcessingOptions]
      - recognizer: "trocr" | "paddle" | "tesseract"
      - use_beam_search: bool
      - confidence_threshold: float

- ProcessingOptions:
    * recognizer_backend: str
    * use_preprocessing: bool
    * apply_denoising: bool
    * return_bounding_boxes: bool

RESPONSE MODELS:
- ExtractResponse:
    * success: bool
    * ledger: LedgerDocument (from schemas)
    * processing_time: float
    * confidence: float
    * metadata: dict

- ErrorResponse:
    * error: str
    * error_code: str
    * details: dict

---

middleware.py DEFINITION:
-------------------------

RESPONSIBILITIES:
1. Request validation (file size, type)
2. Authentication (API key or JWT)
3. Rate limiting (requests per minute)
4. Logging (request/response, errors)
5. CORS handling

---

errors.py DEFINITION:
--------------------

CUSTOM EXCEPTIONS:
- InvalidFileTypeError
- FileSizeLimitError
- OCRProcessingError
- ModelNotLoadedError

ERROR HANDLERS:
- Map exceptions to HTTP status codes
- Format error responses consistently
- Log errors with request context

---

INTEGRATION FLOW:
Platform → routes.py → core.pipeline → schemas.LedgerDocument → Platform

NO direct imports of:
- ocr.detection.*
- ocr.recognition.*
- Internal model classes

ONLY imports:
- core.pipeline
- core.orchestrator
- schemas.*
"""