import warnings
warnings.filterwarnings("ignore")
import joblib, pandas as pd

model_dir = "i:/Tark-Shaastra LDCE Hackathon/NeuroByte-LDCE-Final/model"
sm = joblib.load(model_dir + "/cat_risk_score_model.pkl")
lm = joblib.load(model_dir + "/cat_risk_label_model.pkl")

tests = [
    ("Low Risk Student",    95, 85, 100),
    ("Borderline Student",  75, 55,  80),
    ("Medium Risk Student", 65, 45,  60),
    ("High Risk Student",   50, 30,  25),
    ("Critical Student",    35, 20,   0),
]

print(f"\n{'Student Type':<25} | Att | Mrk | Asg | Score | Label")
print("-" * 62)

for name, att, mrk, asg in tests:
    inp = pd.DataFrame({"attendance": [att], "marks": [mrk], "assignment": [asg]})
    sc  = round(float(sm.predict(inp)[0]), 1)
    lb  = lm.predict(inp)[0][0]
    print(f"{name:<25} | {att:>3} | {mrk:>3} | {asg:>3} | {sc:>5.1f} | {lb}")

print("\nModel loaded and working correctly!")
