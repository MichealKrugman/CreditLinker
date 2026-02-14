"""
CreditLinker SDK - Financial Document OCR and Extraction

Main Components:
- core.pipeline: Document extraction pipeline
- core.orchestrator: Model management and execution
- api: REST API interface
- ocr: Detection and recognition engines
- rules_engine: Transaction parsing and validation
- schemas: Data models

Quick Start:
    >>> from SDK import Orchestrator, Config
    >>> config = Config.load("config.yaml")
    >>> orchestrator = Orchestrator(config)
    >>> result = orchestrator.execute(image)
"""

__version__ = "1.0.0"
__author__ = "CreditLinker Team"

# Will be implemented later - these are placeholders
# from .core.pipeline import ExtractionPipeline
# from .core.orchestrator import Orchestrator
# from .core.config import Config
# from .schemas.ledger_schema import LedgerDocument, Transaction

__all__ = [
    # "ExtractionPipeline",
    # "Orchestrator",
    # "Config",
    # "LedgerDocument",
    # "Transaction",
]
