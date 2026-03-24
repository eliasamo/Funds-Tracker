import json
from pathlib import Path
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from xgboost import XGBRegressor

MODEL_PATH = Path("ml/models/xgboost_signals.json")
META_PATH = Path("ml/models/xgboost_signals.meta.json")


def _load_model() -> XGBRegressor:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found at {MODEL_PATH}. Run ml/train_xgboost.py first."
        )

    model = XGBRegressor()
    model.load_model(str(MODEL_PATH))
    return model


def _load_metadata() -> dict:
    if not META_PATH.exists():
        return {
            "feature_columns": [
                "holdingWeight",
                "newsCount7d",
                "avgSentiment",
                "positiveShare",
                "negativeShare",
                "neutralShare",
            ],
            "action_thresholds": {
                "buy": 0.02,
                "sell": -0.02,
            },
            "version": "xgboost-local-no-meta",
        }
    return json.loads(META_PATH.read_text(encoding="utf-8"))


class ScoreRow(BaseModel):
    ticker: str
    holdingWeight: float
    newsCount7d: float
    avgSentiment: float
    positiveShare: float
    negativeShare: float
    neutralShare: float


class ScoreRequest(BaseModel):
    fundIsin: Optional[str] = None
    rows: List[ScoreRow] = Field(default_factory=list)


app = FastAPI(title="Stock Tracker XGBoost Scorer")


@app.get("/health")
def health() -> dict:
    return {
        "ok": MODEL_PATH.exists(),
        "model_path": str(MODEL_PATH),
        "meta_path": str(META_PATH),
    }


@app.post("/score")
def score(payload: ScoreRequest) -> dict:
    if not payload.rows:
        return {
            "rows": [],
            "modelVersion": "xgboost-empty",
            "actionThresholds": {"buy": 0.02, "sell": -0.02},
            "confidenceScaleAbs": 0.05,
        }

    try:
        model = _load_model()
        metadata = _load_metadata()
    except FileNotFoundError as err:
        raise HTTPException(status_code=503, detail=str(err))

    features = metadata.get("feature_columns") or [
        "holdingWeight",
        "newsCount7d",
        "avgSentiment",
        "positiveShare",
        "negativeShare",
        "neutralShare",
    ]

    matrix = []
    for row in payload.rows:
        item = row.model_dump()
        matrix.append([float(item.get(col, 0.0)) for col in features])

    x = np.asarray(matrix, dtype=float)
    preds = model.predict(x)

    return {
        "rows": [
            {
                "ticker": payload.rows[i].ticker,
                "score": float(preds[i]),
            }
            for i in range(len(payload.rows))
        ],
        "modelVersion": metadata.get("trained_at", "xgboost-local"),
        "actionThresholds": metadata.get("action_thresholds", {"buy": 0.02, "sell": -0.02}),
        "confidenceScaleAbs": float(metadata.get("confidence_scale_abs", 0.05)),
    }
