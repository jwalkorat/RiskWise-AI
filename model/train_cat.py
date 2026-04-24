import pandas as pd
from sklearn.model_selection import train_test_split
from catboost import CatBoostRegressor, CatBoostClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, accuracy_score, precision_score, recall_score, f1_score, classification_report
import joblib

def train_and_evaluate(csv_path):
    print(f"Loading data from {csv_path}...")
    # Load dataset
    df = pd.read_csv(csv_path)
    
    # 1. Prepare Features (X) and Targets (y)
    X = df[['attendance', 'marks', 'assignment']]
    y_score = df['risk_score']
    y_label = df['risk_label']
    
    # 2. Split data into training and testing sets
    X_train, X_test, y_score_train, y_score_test, y_label_train, y_label_test = train_test_split(
        X, y_score, y_label, test_size=0.2, random_state=42
    )
    
    print("\n--- Training Models (CatBoost) ---")
    # 3. Model for predicting risk_score (Regression)
    score_model = Pipeline([
        ('imputer', SimpleImputer(strategy='mean')),
        ('cat', CatBoostRegressor(iterations=100, random_seed=42, verbose=0))
    ])
    print("Training CatBoost Risk Score Model...")
    score_model.fit(X_train, y_score_train)
    
    # 4. Model for predicting risk_label (Classification)
    # CatBoost natively handles string labels (Low, Medium, High) so no LabelEncoder is needed!
    label_model = Pipeline([
        ('imputer', SimpleImputer(strategy='mean')),
        ('cat', CatBoostClassifier(iterations=100, random_seed=42, verbose=0, loss_function='MultiClass'))
    ])
    print("Training CatBoost Risk Label Model...")
    label_model.fit(X_train, y_label_train)
    
    print("\n--- Evaluating Models ---")
    # Evaluate Score Model
    score_predictions = score_model.predict(X_test)
    mse = mean_squared_error(y_score_test, score_predictions)
    print(f"Risk Score Model MSE: {mse:.2f}")
    
    # Evaluate Label Model
    label_predictions = label_model.predict(X_test)
    
    # CatBoost predicts a 2D array of labels (e.g. [['Low'], ['Medium']]), so we flatten it to 1D
    label_predictions = [pred[0] for pred in label_predictions]
    
    acc = accuracy_score(y_label_test, label_predictions)
    prec = precision_score(y_label_test, label_predictions, average='weighted', zero_division=0)
    rec = recall_score(y_label_test, label_predictions, average='weighted', zero_division=0)
    f1 = f1_score(y_label_test, label_predictions, average='weighted', zero_division=0)
    
    print(f"Risk Label Model Accuracy: {acc:.4f}")
    print(f"Risk Label Model Precision: {prec:.4f}")
    print(f"Risk Label Model Recall: {rec:.4f}")
    print(f"Risk Label Model F1-Score: {f1:.4f}")
    
    print("\nDetailed Classification Report:\n", classification_report(y_label_test, label_predictions, zero_division=0))
    
    # 5. Save the models
    joblib.dump(score_model, 'cat_risk_score_model.pkl')
    joblib.dump(label_model, 'cat_risk_label_model.pkl')
    
    print("\nModels saved as 'cat_risk_score_model.pkl' and 'cat_risk_label_model.pkl'")

if __name__ == "__main__":
    train_and_evaluate(r"C:\Users\KASHVI PORWAL\Downloads\TS-PS12_60k (1).csv")
