"""
API_MODELS.PY DEFINITION
=========================

PURPOSE:
--------
Request/response models for API layer.
Ensures consistent API contracts and validation.

REQUEST MODELS:
---------------

class OCRRequest(BaseModel):
    '''
    Request to extract transactions from document.
    '''
    # File can be base64 string or will be uploaded as multipart
    file_base64: Optional[str] = None
    
    # Optional configuration overrides
    options: Optional[OCROptions] = None
    
    # Request metadata
    client_id: Optional[str] = None
    request_id: Optional[str] = None

class OCROptions(BaseModel):
    '''
    Optional configuration for OCR processing.
    '''
    recognizer: str = "trocr"  # "trocr", "paddle", "tesseract"
    detector: str = "paddle"
    use_beam_search: bool = True
    beam_width: int = 5
    confidence_threshold: float = 0.7
    enable_validation: bool = True
    enable_confidence_calculation: bool = True

class BatchOCRRequest(BaseModel):
    '''
    Request to process multiple documents in batch.
    '''
    files: List[str]  # Base64 encoded files
    options: Optional[OCROptions] = None
    priority: str = "normal"  # "low", "normal", "high"

RESPONSE MODELS:
----------------

class OCRResponse(BaseModel):
    '''
    Response containing extracted ledger data.
    '''
    success: bool
    data: Optional[LedgerDocumentResponse] = None
    error: Optional[ErrorResponse] = None
    metadata: ResponseMetadata

class LedgerDocumentResponse(BaseModel):
    '''
    Extracted ledger document (simplified for API).
    '''
    transactions: List[TransactionResponse]
    transaction_count: int
    summary: SummaryStatistics
    confidence_score: float
    validation_status: str  # "VALID", "WARNING", "INVALID"

class TransactionResponse(BaseModel):
    '''
    Single transaction (API format).
    '''
    date: str  # ISO format: "2024-01-01T00:00:00"
    description: str
    debit: float
    credit: float
    balance: Optional[float]
    currency: str
    transaction_type: Optional[str]
    confidence: float

class SummaryStatistics(BaseModel):
    '''
    Summary statistics for ledger.
    '''
    total_debits: float
    total_credits: float
    net_cashflow: float
    opening_balance: float
    closing_balance: float
    date_range_start: str
    date_range_end: str

class ResponseMetadata(BaseModel):
    '''
    Metadata about the processing.
    '''
    processing_time_ms: int
    model_used: str
    sdk_version: str
    page_count: int
    request_id: Optional[str]
    timestamp: str

class ErrorResponse(BaseModel):
    '''
    Error information.
    '''
    code: str  # "INVALID_FILE", "OCR_FAILED", "VALIDATION_ERROR", etc.
    message: str
    details: Optional[Dict] = None

class BatchOCRResponse(BaseModel):
    '''
    Response for batch processing.
    '''
    success: bool
    results: List[OCRResponse]
    total_processed: int
    total_succeeded: int
    total_failed: int
    processing_time_ms: int

STATUS RESPONSE:
----------------

class StatusResponse(BaseModel):
    '''
    Health check / status response.
    '''
    status: str  # "healthy", "degraded", "unhealthy"
    models_loaded: List[str]
    gpu_available: bool
    version: str
    uptime_seconds: int

ERROR CODES:
------------

# Client errors (4xx)
INVALID_FILE_FORMAT = "INVALID_FILE_FORMAT"
FILE_TOO_LARGE = "FILE_TOO_LARGE"
MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
INVALID_OPTIONS = "INVALID_OPTIONS"

# Server errors (5xx)
OCR_FAILED = "OCR_FAILED"
MODEL_NOT_LOADED = "MODEL_NOT_LOADED"
PROCESSING_TIMEOUT = "PROCESSING_TIMEOUT"
INTERNAL_ERROR = "INTERNAL_ERROR"

# Validation errors
VALIDATION_FAILED = "VALIDATION_FAILED"
LOW_CONFIDENCE = "LOW_CONFIDENCE"

EXAMPLE REQUEST/RESPONSE:
-------------------------

REQUEST (JSON):
{
  "file_base64": "iVBORw0KGgoAAAANSUhEU...",
  "options": {
    "recognizer": "trocr",
    "use_beam_search": true,
    "confidence_threshold": 0.8
  },
  "client_id": "mobile-app-v1.2",
  "request_id": "req-12345-abcde"
}

RESPONSE (Success):
{
  "success": true,
  "data": {
    "transactions": [
      {
        "date": "2024-01-01T00:00:00",
        "description": "Opening Balance",
        "debit": 0.0,
        "credit": 0.0,
        "balance": 50000.0,
        "currency": "NGN",
        "transaction_type": "OPENING",
        "confidence": 0.95
      },
      {
        "date": "2024-01-02T00:00:00",
        "description": "Salary Credit",
        "debit": 0.0,
        "credit": 100000.0,
        "balance": 150000.0,
        "currency": "NGN",
        "transaction_type": "SALARY",
        "confidence": 0.92
      }
    ],
    "transaction_count": 2,
    "summary": {
      "total_debits": 0.0,
      "total_credits": 100000.0,
      "net_cashflow": 100000.0,
      "opening_balance": 50000.0,
      "closing_balance": 150000.0,
      "date_range_start": "2024-01-01T00:00:00",
      "date_range_end": "2024-01-02T00:00:00"
    },
    "confidence_score": 0.87,
    "validation_status": "VALID"
  },
  "error": null,
  "metadata": {
    "processing_time_ms": 2345,
    "model_used": "trocr",
    "sdk_version": "1.0.0",
    "page_count": 1,
    "request_id": "req-12345-abcde",
    "timestamp": "2024-02-13T10:30:00Z"
  }
}

RESPONSE (Error):
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_FILE_FORMAT",
    "message": "Unsupported file format. Only JPEG, PNG, and PDF are supported.",
    "details": {
      "file_format_detected": "WEBP",
      "supported_formats": ["JPEG", "PNG", "PDF"]
    }
  },
  "metadata": {
    "processing_time_ms": 45,
    "model_used": null,
    "sdk_version": "1.0.0",
    "page_count": 0,
    "request_id": "req-12345-abcde",
    "timestamp": "2024-02-13T10:30:00Z"
  }
}

FASTAPI IMPLEMENTATION:
-----------------------

from fastapi import FastAPI, UploadFile, File, HTTPException
from sdk.api_models import OCRRequest, OCRResponse, ErrorResponse

app = FastAPI()

@app.post("/api/v1/extract", response_model=OCRResponse)
async def extract_transactions(
    file: UploadFile = File(...),
    options: Optional[OCROptions] = None
):
    '''
    Extract transactions from uploaded statement.
    '''
    try:
        # Read file
        file_bytes = await file.read()
        
        # Process with SDK
        from sdk.core.pipeline import run
        ledger_document = run(file_bytes, options)
        
        # Convert to API response
        response = OCRResponse(
            success=True,
            data=LedgerDocumentResponse.from_ledger_document(ledger_document),
            metadata=ResponseMetadata(
                processing_time_ms=...,
                model_used=options.recognizer if options else "trocr",
                sdk_version="1.0.0",
                page_count=ledger_document.page_count,
                timestamp=datetime.utcnow().isoformat()
            )
        )
        return response
        
    except Exception as e:
        # Error handling
        return OCRResponse(
            success=False,
            error=ErrorResponse(
                code="INTERNAL_ERROR",
                message=str(e)
            ),
            metadata=ResponseMetadata(...)
        )

@app.get("/api/v1/status", response_model=StatusResponse)
async def get_status():
    '''
    Health check endpoint.
    '''
    return StatusResponse(
        status="healthy",
        models_loaded=["trocr", "paddle_detector"],
        gpu_available=torch.cuda.is_available(),
        version="1.0.0",
        uptime_seconds=...
    )

VALIDATION:
-----------

All models use Pydantic for automatic validation:

# This will raise ValidationError if data is invalid
try:
    request = OCRRequest(**request_data)
except ValidationError as e:
    return ErrorResponse(
        code="INVALID_REQUEST",
        message="Request validation failed",
        details=e.errors()
    )

OPENAPI SCHEMA:
---------------

FastAPI automatically generates OpenAPI schema from these models:

{
  "openapi": "3.0.0",
  "info": {
    "title": "OCR SDK API",
    "version": "1.0.0"
  },
  "paths": {
    "/api/v1/extract": {
      "post": {
        "summary": "Extract transactions from statement",
        "requestBody": {
          "content": {
            "multipart/form-data": {
              "schema": {
                "$ref": "#/components/schemas/OCRRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful extraction",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/OCRResponse"
                }
              }
            }
          }
        }
      }
    }
  }
}
"""
