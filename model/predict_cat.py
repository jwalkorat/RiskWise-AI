import pandas as pd
import numpy as np
import joblib

def predict_new_student(attendance=np.nan, marks=np.nan, assignment=np.nan):
    try:
        score_model = joblib.load('cat_risk_score_model.pkl')
        label_model = joblib.load('cat_risk_label_model.pkl')
    except FileNotFoundError:
        print("Models not found. Please train them first using train_cat.py")
        return
    
    input_data = pd.DataFrame({
        'attendance': [attendance],
        'marks': [marks],
        'assignment': [assignment]
    })
    
    predicted_score = score_model.predict(input_data)[0]
    
    # CatBoost predict returns 2D array, so we get the first string inside the first array element
    predicted_label = label_model.predict(input_data)[0][0]
    
    print(f"\n--- CatBoost Prediction Results ---")
    provided_inputs = {k: v for k, v in zip(['attendance', 'marks', 'assignment'], [attendance, marks, assignment]) if not pd.isna(v)}
    input_str = ", ".join([f"{k.capitalize()}={v}" for k, v in provided_inputs.items()])
    
    print(f"Input: {input_str}")
    print(f"Predicted Risk Score: {predicted_score:.2f}")
    print(f"Predicted Risk Label: {predicted_label}")
    
    return predicted_score, predicted_label

if __name__ == "__main__":
    user_input = input("Enter (e.g. attendance=56, marks=90): ")
    
    kwargs = {}
    if user_input.strip():
        parts = user_input.split(',')
        for part in parts:
            if '=' in part:
                key, val = part.split('=')
                key = key.strip().lower()
                if key == 'attendence':
                    key = 'attendance'
                
                try:
                    kwargs[key] = float(val.strip())
                except ValueError:
                    print(f"Warning: Could not convert '{val}' to a number. Skipping.")
                
    predict_new_student(**kwargs)
