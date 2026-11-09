"""
FastAPI Server for FTTH & HFC Operational Intelligence System
PT. Anugerah Terang Persada
"""

import time
from typing import Dict, List, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from isolation_forest_service import (
    IsolationForestEngine,
    ModelHyperparameters,
    RecordPrediction,
    TrainingSummary,
    FEATURE_COLUMNS,
)

app = FastAPI(
    title="ATP Operational Intelligence API",
    description="Enterprise Machine Learning & SOP Validation API for Work Order Anomaly Detection (FTTH & HFC)",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for Frontend Vite Dev Server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global engine instance
engine = IsolationForestEngine()

class PredictRequest(BaseModel):
    records: List[Dict[str, Any]]
    config: ModelHyperparameters = Field(default_factory=ModelHyperparameters)

class PredictResponse(BaseModel):
    status: str
    engine: str = "Scikit-Learn IsolationForest v1.4.0 (Python FastAPI)"
    execution_time_ms: float
    total_evaluated: int
    anomalies_detected: int
    summary: TrainingSummary
    predictions: List[RecordPrediction]

@app.get("/api/health")
def health_check():
    """
    Diagnostic health check for the Python FastAPI server.
    """
    return {
        "status": "ONLINE",
        "service": "ATP Operational Intelligence Engine",
        "engine": "Python 3.10 + Scikit-Learn IsolationForest",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "features_supported": FEATURE_COLUMNS,
    }

@app.get("/api/model/info")
def model_info():
    """
    Returns current model configuration and feature schema.
    """
    return {
        "model_name": "Isolation Forest Multivariable Anomaly Detector",
        "cohorts": ["FTTH", "HFC"],
        "default_contamination": engine.config.contamination,
        "default_n_estimators": engine.config.n_estimators,
        "features": FEATURE_COLUMNS,
        "pii_protection": "STRICT_ISOLATION",
    }

@app.post("/api/ml/predict", response_model=PredictResponse)
def predict_anomalies(payload: PredictRequest):
    """
    Runs Scikit-Learn IsolationForest on the incoming batch of work orders.
    """
    start_time = time.time()
    try:
        custom_engine = IsolationForestEngine(config=payload.config)
        predictions, summary = custom_engine.train_and_predict(payload.records)
        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        return PredictResponse(
            status="SUCCESS",
            execution_time_ms=elapsed_ms,
            total_evaluated=summary.total_evaluated,
            anomalies_detected=summary.anomalies_detected,
            summary=summary,
            predictions=predictions,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal memproses analisis Isolation Forest: {str(e)}",
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
