"""
FTTH & HFC Isolation Forest Anomaly Detection Service
PT. Anugerah Terang Persada

Pilot-ready revision:
- Supports the output of preprocessing.py (camelCase fields).
- Excludes features that are entirely unavailable instead of filling them with zero.
- Fits median imputation values on the analyzed batch and reports imputation counts.
- Correctly recognizes offerNum / OFFERNUM / WORDER identifiers.
- Keeps Isolation Forest unsupervised: predictions are indications, not SOP violations.
- Keeps train_and_predict() compatible with the existing FastAPI endpoint.

Research limitation:
train_and_predict() fits and predicts on the same incoming batch. This is suitable
for exploratory batch detection, NOT an unbiased model-performance evaluation.
A separate train/test evaluation workflow with independently verified labels is
required before reporting precision, recall, F1-score, or a confusion matrix.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import re

import numpy as np
import pandas as pd
from pydantic import BaseModel, Field
from sklearn.ensemble import IsolationForest


# ============================================================
# 1. MODEL CONFIGURATION
# ============================================================

class ModelHyperparameters(BaseModel):
    n_estimators: int = Field(default=100, ge=10, le=1000)
    contamination: float = Field(default=0.05, gt=0.0, le=0.5)
    max_samples: Any = "auto"
    max_features: float = Field(default=1.0, gt=0.0, le=1.0)
    random_state: int = 42
    min_sample_size_for_cohort: int = Field(default=30, ge=2)


# ============================================================
# 2. RESPONSE SCHEMAS
# ============================================================

class FeatureDeviation(BaseModel):
    feature_name: str
    feature_label: str
    observed_value: Any
    benchmark_median: Any
    benchmark_range: str
    deviation_ratio: str
    interpretation: str


class RecordPrediction(BaseModel):
    offernum: str
    prediction: int
    anomaly_score: float
    decision_score: float
    network_type: str
    deviating_features: List[FeatureDeviation]
    recommendation: str
    is_ml_anomaly: bool = False
    anomaly_level: str = "NORMAL"


class TrainingSummary(BaseModel):
    model_version: str
    trained_at: str
    total_evaluated: int
    ftth_sample_count: int
    hfc_sample_count: int
    anomalies_detected: int
    contamination_rate: float
    features_used: List[str]
    parameters: Dict[str, Any]
    status: str

    model_strategy: str = "UNIFIED"
    n_estimators: int = 100
    normal_count: int = 0
    anomaly_rate_actual: float = 0.0

    # Auditability and research transparency.
    features_excluded: List[str] = Field(default_factory=list)
    missing_values_imputed: Dict[str, int] = Field(default_factory=dict)
    training_mode: str = "IN_SAMPLE_BATCH_DETECTION"
    evaluation_note: str = (
        "Prediksi pada batch yang sama dengan data fitting; "
        "bukan evaluasi generalisasi pada data uji."
    )


# ============================================================
# 3. FEATURE DEFINITIONS
# ============================================================

# These are the six candidate features in the research design.
# Only features with usable observations in the current batch are used.
FEATURE_COLUMNS = [
    "recording_duration_mins",
    "start_hour",
    "finish_hour",
    "sch_to_start_hours",
    "tech_daily_frequency",
    "report_to_close_mins",
]

FEATURE_LABELS = {
    "recording_duration_mins": "Durasi Pengerjaan",
    "start_hour": "Jam Mulai Pelaksanaan",
    "finish_hour": "Jam Selesai Pelaksanaan",
    "sch_to_start_hours": "Penyimpangan Jadwal ke Mulai",
    "tech_daily_frequency": "Frekuensi Pekerjaan Harian Teknisi",
    "report_to_close_mins": "Durasi Laporan ke Tutup Tiket",
}

FEATURE_ALIASES = {
    "recording_duration_mins": [
        "recordingWindowMinutes",
        "recording_duration_mins",
        "durationMinutes",
    ],
    "start_hour": [
        "start_hour",
        "start",
        "START",
        "startTime",
    ],
    "finish_hour": [
        "finish_hour",
        "finish",
        "FINISH",
        "finishTime",
    ],
    "sch_to_start_hours": [
        "schToStartHours",
        "sch_to_start_hours",
        "scheduleDeviationHours",
        # Intentionally do not use schToReportHours: it is not
        # semantically equivalent to schedule-to-actual-start.
    ],
    "tech_daily_frequency": [
        "techDailyJobCount",
        "tech_daily_frequency",
        "technicianDailyCount",
    ],
    "report_to_close_mins": [
        "reportToCloseMinutes",
        "report_to_close_mins",
        "reportCloseDuration",
    ],
}


# ============================================================
# 4. GENERAL HELPERS
# ============================================================

def normalize_network_type(value: Any) -> str:
    if value is None or pd.isna(value):
        return "UNKNOWN"

    text = str(value).strip().upper()
    if text in ("FTTH", "GPON") or "FTTH" in text:
        return "FTTH"
    if text in ("HFC", "DOCSIS") or "HFC" in text:
        return "HFC"
    return "UNKNOWN"


def to_numeric(value: Any) -> float:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return np.nan
    if isinstance(value, (int, float, np.number)):
        result = float(value)
        return result if np.isfinite(result) else np.nan

    text = str(value).strip()
    if not text:
        return np.nan

    # Basic decimal comma support.
    if "," in text and "." not in text:
        text = text.replace(",", ".")

    try:
        result = float(text)
        return result if np.isfinite(result) else np.nan
    except (ValueError, TypeError):
        return np.nan


def extract_hour(value: Any) -> float:
    """Extract hour safely from Excel times, numeric hours, and datetime strings."""
    if value is None:
        return np.nan

    if isinstance(value, (datetime, pd.Timestamp)):
        return float(value.hour)

    if isinstance(value, (int, float, np.number)):
        number = float(value)
        if not np.isfinite(number):
            return np.nan
        # Accept numeric hour values from the preprocessing output.
        if 0 <= number <= 23:
            return number
        # Excel time fractions are between 0 and 1.
        if 0 <= number < 1:
            return number * 24
        return np.nan

    text = str(value).strip()
    if not text:
        return np.nan

    # Prefer a clock component in a datetime string, avoiding the year prefix.
    match = re.search(r"(?:T|\s)(\d{1,2}):(\d{2})(?::\d{2})?", text)
    if not match:
        match = re.fullmatch(r"\s*(\d{1,2})[:.](\d{2})(?::\d{2})?\s*", text)
    if not match:
        match = re.fullmatch(r"\s*(\d{1,2})\s*", text)
        if match:
            hour = int(match.group(1))
            return float(hour) if 0 <= hour <= 23 else np.nan
        return np.nan

    hour = int(match.group(1))
    minute = int(match.group(2))
    if 0 <= hour <= 23 and 0 <= minute <= 59:
        return float(hour) + minute / 60.0
    return np.nan


def get_first_existing(
    df: pd.DataFrame,
    columns: List[str],
) -> Optional[str]:
    for column in columns:
        if column in df.columns:
            return column
    return None


def get_config_dict(config: ModelHyperparameters) -> Dict[str, Any]:
    if hasattr(config, "model_dump"):
        return config.model_dump()
    return config.dict()


# ============================================================
# 5. ISOLATION FOREST ENGINE
# ============================================================

class IsolationForestEngine:
    def __init__(self, config: Optional[ModelHyperparameters] = None):
        self.config = config or ModelHyperparameters()

        self.ftth_model: Optional[IsolationForest] = None
        self.hfc_model: Optional[IsolationForest] = None
        self.unified_model: Optional[IsolationForest] = None

        self.is_trained = False
        self.feature_names: List[str] = []
        self.excluded_features: List[str] = []
        self.imputation_medians: Dict[str, float] = {}
        self.model_strategy = "UNIFIED"

    # --------------------------------------------------------
    # 5.1 FEATURE EXTRACTION
    # --------------------------------------------------------

    def _extract_raw_features(self, df: pd.DataFrame) -> pd.DataFrame:
        features = pd.DataFrame(index=df.index)

        for feature_name, aliases in FEATURE_ALIASES.items():
            source_col = get_first_existing(df, aliases)

            if source_col is None:
                features[feature_name] = np.nan
            elif feature_name in ("start_hour", "finish_hour"):
                features[feature_name] = df[source_col].apply(extract_hour)
            else:
                features[feature_name] = df[source_col].apply(to_numeric)

        features = features.replace([np.inf, -np.inf], np.nan)

        # Domain sanity limits. These are guardrails, not anomaly thresholds.
        bounds = {
            "recording_duration_mins": (0, 1440),
            "start_hour": (0, 23.999),
            "finish_hour": (0, 23.999),
            "sch_to_start_hours": (-48, 168),
            "tech_daily_frequency": (0, 100),
            "report_to_close_mins": (0, 10080),
        }
        for column, (lower, upper) in bounds.items():
            features[column] = features[column].clip(lower=lower, upper=upper)

        return features

    def _prepare_features(
        self,
        raw_features: pd.DataFrame,
    ) -> Tuple[pd.DataFrame, Dict[str, int]]:
        """
        Drop entirely missing features; median-impute only partially missing
        features. The median is calculated from this analyzed batch and the
        imputation count is returned for transparency.
        """
        available = [
            column for column in FEATURE_COLUMNS
            if column in raw_features.columns and raw_features[column].notna().any()
        ]
        self.excluded_features = [
            column for column in FEATURE_COLUMNS if column not in available
        ]

        if not available:
            raise ValueError(
                "Tidak ada fitur operasional yang memiliki nilai valid. "
                "Periksa mapping kolom pada preprocessing."
            )

        prepared = raw_features[available].copy()
        imputed_counts: Dict[str, int] = {}
        self.imputation_medians = {}

        for column in available:
            median_value = prepared[column].median()
            if pd.isna(median_value):
                continue

            missing_count = int(prepared[column].isna().sum())
            imputed_counts[column] = missing_count
            self.imputation_medians[column] = float(median_value)
            prepared[column] = prepared[column].fillna(median_value)

        # Remove constant features: they cannot distinguish observations.
        non_constant = [
            column for column in prepared.columns
            if prepared[column].nunique(dropna=False) > 1
        ]
        constant_features = [
            column for column in prepared.columns if column not in non_constant
        ]
        self.excluded_features.extend(constant_features)
        prepared = prepared[non_constant]

        if prepared.empty:
            raise ValueError(
                "Seluruh fitur yang tersedia bernilai konstan. "
                "Isolation Forest tidak dapat membedakan pola pada batch ini."
            )

        self.feature_names = prepared.columns.tolist()
        return prepared.astype(float), imputed_counts

    # --------------------------------------------------------
    # 5.2 MODEL
    # --------------------------------------------------------

    def _create_model(self) -> IsolationForest:
        return IsolationForest(
            n_estimators=self.config.n_estimators,
            contamination=self.config.contamination,
            max_samples=self.config.max_samples,
            max_features=self.config.max_features,
            random_state=self.config.random_state,
            n_jobs=-1,
        )

    # --------------------------------------------------------
    # 5.3 SCORE NORMALIZATION
    # --------------------------------------------------------

    @staticmethod
    def _normalize_anomaly_scores(decision_scores: np.ndarray) -> np.ndarray:
        """Relative rank [0,1], NOT an anomaly probability."""
        anomaly_strength = -decision_scores
        ranks = pd.Series(anomaly_strength).rank(method="average", pct=True)
        return ranks.to_numpy(dtype=float)

    # --------------------------------------------------------
    # 5.4 FEATURE DEVIATION
    # --------------------------------------------------------

    def _get_deviating_features(
        self,
        feature_row: pd.DataFrame,
        reference_features: pd.DataFrame,
        network_type: str,
    ) -> List[FeatureDeviation]:
        deviations: List[FeatureDeviation] = []

        medians = reference_features.median()
        stds = reference_features.std(ddof=0).replace(0, 1.0).fillna(1.0)

        for column in self.feature_names:
            observed = float(feature_row[column].iloc[0])
            median = float(medians[column])
            std = float(stds[column])
            z_score = abs(observed - median) / std

            if z_score < 1.75:
                continue

            lower = median - std
            upper = median + std
            if column == "recording_duration_mins":
                lower = max(0, lower)

            deviations.append(
                FeatureDeviation(
                    feature_name=column,
                    feature_label=FEATURE_LABELS.get(column, column),
                    observed_value=round(observed, 2),
                    benchmark_median=round(median, 2),
                    benchmark_range=f"{lower:.2f} - {upper:.2f}",
                    deviation_ratio=f"{z_score:.2f}x StdDev",
                    interpretation=(
                        "Nilai berbeda dari karakteristik kelompok "
                        f"jaringan {network_type}; perlu pemeriksaan konteks."
                    ),
                )
            )

        return deviations

    # --------------------------------------------------------
    # 5.5 TRAIN AND PREDICT
    # --------------------------------------------------------

    def train_and_predict(
        self,
        records: List[Dict[str, Any]],
    ) -> Tuple[List[RecordPrediction], TrainingSummary]:
        """
        Exploratory batch detection.

        IMPORTANT: model is fitted and predicts on the same batch.
        Do not use this output to claim held-out test performance.
        """
        trained_at = pd.Timestamp.now().isoformat()
        config_dict = get_config_dict(self.config)

        if not records:
            self.is_trained = False
            summary = TrainingSummary(
                model_version="v3.1.0-SKLEARN",
                trained_at=trained_at,
                total_evaluated=0,
                ftth_sample_count=0,
                hfc_sample_count=0,
                anomalies_detected=0,
                contamination_rate=self.config.contamination,
                features_used=[],
                parameters=config_dict,
                status="NO_DATA",
                model_strategy="NONE",
                n_estimators=self.config.n_estimators,
            )
            return [], summary

        df = pd.DataFrame(records).reset_index(drop=True)

        network_col = get_first_existing(
            df,
            ["networkType", "Jenis_Jaringan", "Jenis Jaringan", "network_type"],
        )
        if network_col:
            df["_network_type"] = df[network_col].apply(normalize_network_type)
        else:
            df["_network_type"] = "UNKNOWN"

        ftth_mask = df["_network_type"] == "FTTH"
        hfc_mask = df["_network_type"] == "HFC"
        ftth_count = int(ftth_mask.sum())
        hfc_count = int(hfc_mask.sum())

        raw_features = self._extract_raw_features(df)
        X_df, imputed_counts = self._prepare_features(raw_features)

        min_cohort = self.config.min_sample_size_for_cohort
        can_split = (
            ftth_count >= min_cohort
            and hfc_count >= min_cohort
            and (ftth_count + hfc_count == len(df))
        )

        self.ftth_model = None
        self.hfc_model = None
        self.unified_model = None
        model_map: Dict[str, IsolationForest] = {}
        reference_map: Dict[str, pd.DataFrame] = {}

        if can_split:
            self.model_strategy = "DUAL_MODEL"
            ftth_X = X_df.loc[ftth_mask].copy()
            hfc_X = X_df.loc[hfc_mask].copy()

            self.ftth_model = self._create_model()
            self.ftth_model.fit(ftth_X)
            model_map["FTTH"] = self.ftth_model
            reference_map["FTTH"] = ftth_X

            self.hfc_model = self._create_model()
            self.hfc_model.fit(hfc_X)
            model_map["HFC"] = self.hfc_model
            reference_map["HFC"] = hfc_X
        else:
            self.model_strategy = "UNIFIED"
            self.unified_model = self._create_model()
            self.unified_model.fit(X_df)
            model_map["UNIFIED"] = self.unified_model
            reference_map["UNIFIED"] = X_df

        temporary: List[Dict[str, Any]] = []
        anomaly_count = 0

        for position in range(len(df)):
            row = df.iloc[position]
            feature_row = X_df.iloc[[position]]
            network_type = row["_network_type"]

            cohort = network_type if can_split else "UNIFIED"
            model = model_map[cohort]
            reference_features = reference_map[cohort]

            raw_prediction = int(model.predict(feature_row)[0])
            decision_score = float(model.decision_function(feature_row)[0])
            if raw_prediction == -1:
                anomaly_count += 1

            temporary.append({
                "row": row,
                "feature_row": feature_row,
                "network_type": network_type,
                "prediction": raw_prediction,
                "decision_score": decision_score,
                "reference_features": reference_features,
                "cohort": cohort,
            })

        # Normalize score within the model cohort.
        for cohort in (["FTTH", "HFC"] if can_split else ["UNIFIED"]):
            items = [item for item in temporary if item["cohort"] == cohort]
            decision_values = np.array(
                [item["decision_score"] for item in items], dtype=float
            )
            normalized = self._normalize_anomaly_scores(decision_values)
            for index, item in enumerate(items):
                item["anomaly_score"] = float(normalized[index])

        final_predictions: List[RecordPrediction] = []

        for item in temporary:
            row = item["row"]
            feature_row = item["feature_row"]
            network_type = item["network_type"]
            raw_prediction = item["prediction"]
            anomaly_score = item["anomaly_score"]
            decision_score = item["decision_score"]
            reference_features = item["reference_features"]

            is_anomaly = raw_prediction == -1
            if not is_anomaly:
                anomaly_level = "NORMAL"
            elif anomaly_score >= 0.98:
                anomaly_level = "EXTREME"
            else:
                anomaly_level = "MODERATE"

            deviations = self._get_deviating_features(
                feature_row, reference_features, network_type
            )

            if is_anomaly:
                recommendation = (
                    "Teridentifikasi indikasi pola statistik yang tidak biasa "
                    "berdasarkan Isolation Forest. Lakukan verifikasi "
                    "administratif oleh supervisor; hasil model bukan bukti "
                    "pelanggaran SOP."
                )
            else:
                recommendation = (
                    "Tidak teridentifikasi sebagai anomali oleh model "
                    "Isolation Forest pada batch ini."
                )

            identifier = row.get(
                "offerNum",
                row.get("offernum", row.get("OFFERNUM", row.get("WORDER"))),
            )
            if identifier is None or str(identifier).strip().lower() in {
                "", "none", "nan"
            }:
                identifier = f"WO-{row.name}"

            final_predictions.append(
                RecordPrediction(
                    offernum=str(identifier),
                    prediction=int(raw_prediction),
                    anomaly_score=round(float(anomaly_score), 4),
                    decision_score=round(float(decision_score), 6),
                    network_type=network_type,
                    deviating_features=deviations,
                    recommendation=recommendation,
                    is_ml_anomaly=is_anomaly,
                    anomaly_level=anomaly_level,
                )
            )

        normal_count = len(df) - anomaly_count
        actual_anomaly_rate = anomaly_count / len(df) if len(df) else 0.0

        summary = TrainingSummary(
            model_version="v3.1.0-SKLEARN",
            trained_at=trained_at,
            total_evaluated=len(df),
            ftth_sample_count=ftth_count,
            hfc_sample_count=hfc_count,
            anomalies_detected=anomaly_count,
            contamination_rate=self.config.contamination,
            features_used=self.feature_names,
            parameters=config_dict,
            status="SUCCESS",
            model_strategy=self.model_strategy,
            n_estimators=self.config.n_estimators,
            normal_count=normal_count,
            anomaly_rate_actual=round(actual_anomaly_rate, 4),
            features_excluded=sorted(set(self.excluded_features)),
            missing_values_imputed=imputed_counts,
            training_mode="IN_SAMPLE_BATCH_DETECTION",
            evaluation_note=(
                "Model dilatih dan memprediksi batch yang sama. Hasil ini "
                "untuk eksplorasi deteksi, bukan evaluasi generalisasi. "
                "Precision, recall, F1-score, dan confusion matrix memerlukan "
                "data uji terpisah dengan label verifikasi supervisor."
            ),
        )

        self.is_trained = True
        return final_predictions, summary
