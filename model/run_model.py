import argparse
import pandas as pd
import numpy as np
import joblib
import json
import sys
import os

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--attendance', type=float, required=True)
    parser.add_argument('--marks', type=float, required=True)
    parser.add_argument('--assignment', type=float, required=True)
    args = parser.parse_args()

    # Determine absolute path to the .pkl models
    model_dir = os.path.dirname(os.path.abspath(__file__))
    
    try:
        score_model = joblib.load(os.path.join(model_dir, 'cat_risk_score_model.pkl'))
        label_model = joblib.load(os.path.join(model_dir, 'cat_risk_label_model.pkl'))
    except FileNotFoundError:
        print(json.dumps({"error": "Models not found in " + model_dir}))
        sys.exit(1)
        
    input_data = pd.DataFrame({
        'attendance': [args.attendance],
        'marks': [args.marks],
        'assignment': [args.assignment]
    })

    try:
        predicted_score = float(score_model.predict(input_data)[0])
        predicted_label = str(label_model.predict(input_data)[0][0])
        
        # Standardize expected label casing for the TS interface (Low, Medium, High)
        if 'low' in predicted_label.lower():
            predicted_label = 'Low'
        elif 'medium' in predicted_label.lower():
            predicted_label = 'Medium'
        elif 'high' in predicted_label.lower():
            predicted_label = 'High'
            
        print(json.dumps({
            "score": predicted_score,
            "label": predicted_label
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    import warnings
    warnings.filterwarnings("ignore") # Suppress warnings that might corrupt JSON output
    main()
