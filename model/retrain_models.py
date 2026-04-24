"""
Retrain CatBoost models with the current sklearn/catboost versions.
Uses synthetic data matching the original training schema:
  Features: attendance (%), marks (%), assignment (completion score 0-100)
  Targets:  risk_score (0-100), risk_label (Low/Medium/High)
"""

import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from catboost import CatBoostRegressor, CatBoostClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, accuracy_score, classification_report
import joblib
import os

# ── 1. Generate 10,000 synthetic records ─────────────────────────────────────
np.random.seed(42)
N = 10_000

attendance    = np.random.uniform(30, 100, N)
marks         = np.random.uniform(10, 100, N)
assignment    = np.random.uniform(0,  100, N)

def compute_risk(att, mrk, asg):
    """Deterministic risk formula consistent with our app's business logic."""
    score = 0
    if att < 60:
        score += 50
    elif att < 75:
        score += 30
    if mrk < 40:
        score += 20
    elif mrk < 55:
        score += 10
    # Each 15-point drop in assignment score ≈ 1 overdue assignment
    overdue = max(0, (100 - asg) / 15)
    score += min(overdue, 5) * 10   # cap contribution at 5 overdues
    score = min(score, 100)
    # Add slight noise so the model doesn't just memorise thresholds
    score += np.random.normal(0, 3)
    score = np.clip(score, 0, 100)
    return round(score, 2)

risk_score = np.array([compute_risk(a, m, s) for a, m, s in zip(attendance, marks, assignment)])

def label_from_score(s):
    if s > 70: return "High"
    if s >= 40: return "Medium"
    return "Low"

risk_label = np.array([label_from_score(s) for s in risk_score])

df = pd.DataFrame({
    "attendance":  attendance,
    "marks":       marks,
    "assignment":  assignment,
    "risk_score":  risk_score,
    "risk_label":  risk_label,
})

print(f"Dataset shape: {df.shape}")
print("Label distribution:\n", df["risk_label"].value_counts())

# ── 2. Train / Test split ─────────────────────────────────────────────────────
X = df[["attendance", "marks", "assignment"]]
y_score = df["risk_score"]
y_label = df["risk_label"]

X_train, X_test, ys_train, ys_test, yl_train, yl_test = train_test_split(
    X, y_score, y_label, test_size=0.2, random_state=42
)

# ── 3. Train Score Model (Regression) ────────────────────────────────────────
print("\nTraining CatBoost Risk Score Model...")
score_model = Pipeline([
    ("imputer", SimpleImputer(strategy="mean")),
    ("cat", CatBoostRegressor(iterations=300, learning_rate=0.05, depth=6,
                               random_seed=42, verbose=0)),
])
score_model.fit(X_train, ys_train)
score_preds = score_model.predict(X_test)
print(f"  MSE:  {mean_squared_error(ys_test, score_preds):.2f}")
print(f"  RMSE: {mean_squared_error(ys_test, score_preds)**0.5:.2f}")

# ── 4. Train Label Model (Classification) ────────────────────────────────────
print("\nTraining CatBoost Risk Label Model...")
label_model = Pipeline([
    ("imputer", SimpleImputer(strategy="mean")),
    ("cat", CatBoostClassifier(iterations=300, learning_rate=0.05, depth=6,
                                random_seed=42, verbose=0, loss_function="MultiClass")),
])
label_model.fit(X_train, yl_train)
label_preds_raw = label_model.predict(X_test)
label_preds = [p[0] for p in label_preds_raw]
print(f"  Accuracy: {accuracy_score(yl_test, label_preds):.4f}")
print(classification_report(yl_test, label_preds, zero_division=0))

# ── 5. Save fresh models ──────────────────────────────────────────────────────
out_dir = os.path.dirname(os.path.abspath(__file__))
joblib.dump(score_model, os.path.join(out_dir, "cat_risk_score_model.pkl"))
joblib.dump(label_model, os.path.join(out_dir, "cat_risk_label_model.pkl"))
print("✅ Models saved successfully!\n")

# ── 6. Quick sanity-check inference ──────────────────────────────────────────
print("Sanity-Check Predictions:")
print(f"{'Student Type':<25} | Att | Mrk | Asg | Score | Label")
print("-" * 65)
test_cases = [
    ("Low Risk Student",    95, 85, 100),
    ("Borderline Student",  75, 55,  80),
    ("Medium Risk Student", 65, 45,  60),
    ("High Risk Student",   50, 30,  25),
    ("Critical Student",    35, 20,   0),
]
for name, att, mrk, asg in test_cases:
    inp = pd.DataFrame({"attendance": [att], "marks": [mrk], "assignment": [asg]})
    sc  = round(float(score_model.predict(inp)[0]), 1)
    lb  = label_model.predict(inp)[0][0]
    print(f"{name:<25} | {att:>3} | {mrk:>3} | {asg:>3} | {sc:>5.1f} | {lb}")
