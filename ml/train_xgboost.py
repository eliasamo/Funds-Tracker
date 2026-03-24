import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor

FEATURE_COLUMNS = [
    "holdingWeight",
    "newsCount7d",
    "avgSentiment",
    "positiveShare",
    "negativeShare",
    "neutralShare",
]
TARGET_COLUMN = "target_return_5d"


def load_dataset(data_path: Path, sample_path: Path) -> pd.DataFrame:
    if data_path.exists():
        df = pd.read_csv(data_path)
        source = str(data_path)
    elif sample_path.exists():
        df = pd.read_csv(sample_path)
        source = str(sample_path)
    else:
        raise FileNotFoundError(
            f"No dataset found. Expected {data_path} or {sample_path}."
        )

    missing = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")

    df = df.dropna(subset=FEATURE_COLUMNS + [TARGET_COLUMN]).copy()
    if df.empty:
        raise ValueError("Dataset is empty after dropping rows with missing values.")

    print(f"Loaded {len(df)} rows from {source}")
    return df


def split_train_test(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    if "snapshot_date" in df.columns:
        df["snapshot_date"] = pd.to_datetime(df["snapshot_date"], errors="coerce")
        dated = df.dropna(subset=["snapshot_date"]).sort_values("snapshot_date")
        if len(dated) >= 20:
            cut = int(len(dated) * 0.8)
            return dated.iloc[:cut], dated.iloc[cut:]

    shuffled = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    cut = max(1, int(len(shuffled) * 0.8))
    return shuffled.iloc[:cut], shuffled.iloc[cut:]


def directional_accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    if len(y_true) == 0:
        return 0.0
    true_sign = np.sign(y_true)
    pred_sign = np.sign(y_pred)
    return float((true_sign == pred_sign).sum() / len(y_true))


def train_model(train_df: pd.DataFrame) -> XGBRegressor:
    x_train = train_df[FEATURE_COLUMNS].astype(float).values
    y_train = train_df[TARGET_COLUMN].astype(float).values

    model = XGBRegressor(
        objective="reg:squarederror",
        n_estimators=350,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_lambda=1.0,
        random_state=42,
    )
    model.fit(x_train, y_train)
    return model


def evaluate(model: XGBRegressor, test_df: pd.DataFrame) -> dict:
    if test_df.empty:
        return {
            "rmse": None,
            "mae": None,
            "directional_accuracy": None,
            "test_rows": 0,
        }

    x_test = test_df[FEATURE_COLUMNS].astype(float).values
    y_test = test_df[TARGET_COLUMN].astype(float).values
    y_pred = model.predict(x_test)

    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    mae = float(mean_absolute_error(y_test, y_pred))
    da = directional_accuracy(y_test, y_pred)

    return {
        "rmse": rmse,
        "mae": mae,
        "directional_accuracy": da,
        "test_rows": int(len(test_df)),
    }


def calibrated_thresholds(train_df: pd.DataFrame) -> tuple[dict, dict]:
    """
    Build thresholds from out-of-fold predictions on the training split.
    This keeps action mapping tied to model score distribution instead of hardcoded values.
    """
    if train_df.empty:
        return (
            {"buy": 0.02, "sell": -0.02},
            {
                "oof_rows": 0,
                "method": "default",
                "confidence_scale_abs": 0.05,
            },
        )

    dated = train_df.copy()
    if "snapshot_date" in dated.columns:
        dated["snapshot_date"] = pd.to_datetime(dated["snapshot_date"], errors="coerce")
        dated = dated.dropna(subset=["snapshot_date"]).sort_values("snapshot_date")

    oof_preds: list[float] = []
    min_train_rows = max(24, int(len(dated) * 0.35))
    split_fractions = [0.55, 0.65, 0.75, 0.85]

    if len(dated) > min_train_rows + 8:
        for frac in split_fractions:
            cut = int(len(dated) * frac)
            if cut < min_train_rows:
                continue

            train_fold = dated.iloc[:cut]
            val_end = min(len(dated), cut + max(8, int(len(dated) * 0.1)))
            val_fold = dated.iloc[cut:val_end]
            if val_fold.empty:
                continue

            fold_model = train_model(train_fold)
            x_val = val_fold[FEATURE_COLUMNS].astype(float).values
            fold_preds = fold_model.predict(x_val)
            oof_preds.extend(float(p) for p in fold_preds)

    if not oof_preds:
        # Fallback if there is insufficient chronological depth.
        model = train_model(train_df)
        x_train = train_df[FEATURE_COLUMNS].astype(float).values
        oof_preds = [float(p) for p in model.predict(x_train)]
        method = "in_sample_fallback"
    else:
        method = "walk_forward_oof"

    preds = np.asarray(oof_preds, dtype=float)
    buy = float(np.quantile(preds, 0.70))
    sell = float(np.quantile(preds, 0.30))

    # Guardrails to avoid degenerate thresholds collapsing into the same value.
    if buy <= sell:
        center = float(np.median(preds))
        spread = float(np.std(preds))
        spread = max(spread, 0.005)
        buy = center + 0.5 * spread
        sell = center - 0.5 * spread

    confidence_scale_abs = float(np.quantile(np.abs(preds), 0.90))
    confidence_scale_abs = max(confidence_scale_abs, 0.01)

    thresholds = {"buy": buy, "sell": sell}
    diagnostics = {
        "oof_rows": int(len(preds)),
        "method": method,
        "confidence_scale_abs": confidence_scale_abs,
        "score_quantiles": {
            "q10": float(np.quantile(preds, 0.10)),
            "q30": float(np.quantile(preds, 0.30)),
            "q50": float(np.quantile(preds, 0.50)),
            "q70": float(np.quantile(preds, 0.70)),
            "q90": float(np.quantile(preds, 0.90)),
        },
    }
    return thresholds, diagnostics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train local XGBoost signal model")
    parser.add_argument(
        "--data",
        default="ml/data/signals_training.csv",
        help="Path to training CSV",
    )
    parser.add_argument(
        "--sample",
        default="ml/data/signals_training.sample.csv",
        help="Fallback sample CSV",
    )
    parser.add_argument(
        "--model-out",
        default="ml/models/xgboost_signals.json",
        help="Path to save XGBoost model",
    )
    parser.add_argument(
        "--meta-out",
        default="ml/models/xgboost_signals.meta.json",
        help="Path to save model metadata",
    )
    args = parser.parse_args()

    data_path = Path(args.data)
    sample_path = Path(args.sample)
    model_out = Path(args.model_out)
    meta_out = Path(args.meta_out)

    model_out.parent.mkdir(parents=True, exist_ok=True)
    meta_out.parent.mkdir(parents=True, exist_ok=True)

    df = load_dataset(data_path, sample_path)
    train_df, test_df = split_train_test(df)

    model = train_model(train_df)
    metrics = evaluate(model, test_df)
    thresholds, calibration = calibrated_thresholds(train_df)

    model.save_model(str(model_out))

    metadata = {
        "model_family": "xgboost",
        "model_type": "regression",
        "target": TARGET_COLUMN,
        "feature_columns": FEATURE_COLUMNS,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "train_rows": int(len(train_df)),
        "metrics": metrics,
        "action_thresholds": thresholds,
        "confidence_scale_abs": calibration["confidence_scale_abs"],
        "calibration": calibration,
        "notes": "Prediction is expected forward 5-day return.",
    }

    meta_out.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print("Training complete")
    print(f"Model: {model_out}")
    print(f"Metadata: {meta_out}")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
