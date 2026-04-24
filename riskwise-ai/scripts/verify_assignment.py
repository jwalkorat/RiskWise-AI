import torch
from torchvision import models, transforms
from PIL import Image
import sys
import os
import json

# -------------------
# CONFIG
# -------------------
# We check multiple common paths inside the Docker container before falling back to Windows
possible_paths = [
    os.path.join(os.path.dirname(__file__), "best.pth"), # /app/scripts/best.pth
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "best.pth"), # /app/best.pth
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "model", "best.pth"), # /app/model/best.pth
    r"C:\Users\KASHVI PORWAL\Downloads\best.pth"
]

MODEL_PATH = possible_paths[-1] # Fallback
for p in possible_paths:
    if os.path.exists(p):
        MODEL_PATH = p
        break

IMG_SIZE = 640
CLASS_NAMES = ['handwritten', 'typed']

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# All standard prints inside AI logic must go to stderr so NextJS JSON parsing isn't broken!
def print_log(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

# -------------------
# LOAD MODEL
# -------------------
try:
    model = models.efficientnet_b0(weights=None)
    # replace classifier for 2 classes
    model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, 2)

    # Note: weights_only=True may require newer PyTorch. If it errors out, remove it.
    state_dict = torch.load(MODEL_PATH, map_location=device, weights_only=True)
    model.load_state_dict(state_dict)

    model.to(device)
    model.eval()
except Exception as e:
    # If the model fails to load, we MUST output valid JSON so the dashboard doesn't crash
    print(json.dumps({"error": f"Model Load Error: {str(e)} - Path: {MODEL_PATH}"}))
    sys.exit(1)

# -------------------
# TRANSFORM
# -------------------
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# -------------------
# PREDICT
# -------------------
def predict_image(img):
    img = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(img)
        probs = torch.softmax(output, dim=1)
        pred = torch.argmax(probs, dim=1).item()

    return CLASS_NAMES[pred], round(probs[0][pred].item()*100, 2)

def process_file(file_path):
    if not os.path.exists(file_path):
        print(json.dumps({"error": f"File not found: {file_path}"}))
        return

    try:
        if file_path.lower().endswith(".pdf"):
            print_log(f"Processing PDF: {file_path}")
            try:
                import fitz  # PyMuPDF
            except ImportError:
                print(json.dumps({"error": "PyMuPDF missing. Wait! Do 'pip install pymupdf' in terminal!"}))
                return
                
            doc = fitz.open(file_path)
            class_counts = {name: 0 for name in CLASS_NAMES}
            confidence_sums = {name: 0.0 for name in CLASS_NAMES}
            # Limit to the first 2 pages max to prevent API timeouts!
            max_pages = min(len(doc), 2)
            for page_num in range(max_pages):
                page = doc.load_page(page_num)
                pix = page.get_pixmap()
                
                # Convert PyMuPDF pixmap to PIL Image
                mode = "RGBA" if pix.alpha else "RGB"
                img = Image.frombytes(mode, [pix.width, pix.height], pix.samples).convert("RGB")
                
                pred_class, conf = predict_image(img)
                class_counts[pred_class] += 1
                confidence_sums[pred_class] += conf
                print_log(f"Page {page_num + 1} - Prediction: {pred_class} | Confidence: {conf}%")
                
            doc.close()
            
            # --- Final Aggregation Output ---
            print_log("\n" + "="*40)
            print_log("FINAL PDF SUMMARY")
            print_log("="*40)
            for cls_name, count in class_counts.items():
                print_log(f"Total '{cls_name}' pages: {count}")
                
            if sum(class_counts.values()) == 0:
                print(json.dumps({"prediction": "Unknown", "confidence": 0.0}))
                return
                
            # Determine the majority prediction for the PDF document
            final_prediction = max(class_counts, key=class_counts.get)
            final_conf = confidence_sums[final_prediction] / class_counts[final_prediction]
            
            print_log(f"\nOVERALL PREDICTION: {final_prediction.upper()}")
            print_log("="*40 + "\n")
            
            # ONLY JSON ON STDOUT
            print(json.dumps({
                "prediction": final_prediction.capitalize(),
                "confidence": round(final_conf, 2)
            }))
            
        else:
            # Treat as an image
            print_log(f"Processing Image: {file_path}")
            img = Image.open(file_path).convert("RGB")
            pred_class, conf = predict_image(img)
            
            print_log(f"Prediction : {pred_class}")
            print_log(f"Confidence : {conf}%")
            
            # ONLY JSON ON STDOUT
            print(json.dumps({
                "prediction": pred_class.capitalize(),
                "confidence": conf
            }))
            
    except Exception as e:
        print(json.dumps({"error": str(e)}))

# -------------------
# MAIN
# -------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided."}))
        sys.exit(1)
        
    process_file(sys.argv[1])
