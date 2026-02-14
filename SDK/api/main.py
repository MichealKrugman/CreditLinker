"""
FastAPI application for Ledger OCR SDK
Runs on port 8001, separate from main Next.js app
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
from core.pipeline import Pipeline
from schemas.responses import LedgerProcessingResult, ErrorResponse

app = FastAPI(
    title="CreditLinker Ledger OCR SDK",
    description="Convert ledger photos to structured transactions",
    version="1.0.0"
)

# CORS - allow main app to call SDK
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize pipeline
pipeline = Pipeline()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "ocr_model": "paddle-v2.7"
    }


@app.post("/process-ledger", response_model=LedgerProcessingResult)
async def process_ledger(file: UploadFile = File(...)):
    """
    Process ledger image and return structured transactions
    
    Args:
        file: Image file (JPEG/PNG)
        
    Returns:
        LedgerProcessingResult with transactions
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(400, "File must be an image")
    
    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # Process image
        result = await pipeline.process_ledger(tmp_path)
        return result
    
    except Exception as e:
        raise HTTPException(500, f"Processing failed: {str(e)}")
    
    finally:
        # Cleanup
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
