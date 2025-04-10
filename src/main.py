import time
import os
import cv2
import json
import numpy as np
from PIL import Image
from dotenv import load_dotenv
import matplotlib.pyplot as plt
from ultralytics import YOLO
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials
from google import genai

# Load environment variables
load_dotenv()
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_KEY = os.getenv("AZURE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Authenticate clients
azure_client = ComputerVisionClient(
    endpoint=AZURE_ENDPOINT,
    credentials=CognitiveServicesCredentials(AZURE_KEY)
)
genai_client = genai.Client(api_key=GEMINI_API_KEY)

# Folder paths
input_dir = "input_files"
face_output_dir = "faces"
os.makedirs(face_output_dir, exist_ok=True)

print("📤 Reading files from 'input_files' directory...")
files_list = [f for f in os.listdir(input_dir) if f.lower().endswith((".jpg", ".jpeg", ".png", ".pdf"))]

all_text = ""
face_count = 0

# Load YOLOv8 model
yolo_model = YOLO("yolov8n.pt")

# Process each file
for file_name in files_list:
    full_path = os.path.join(input_dir, file_name)
    print(f"\n🔍 Processing file: {file_name}")

    # OCR via Azure
    with open(full_path, "rb") as image_stream:
        try:
            raw_response = azure_client.read_in_stream(image_stream, language="en", raw=True)
            operation_location = raw_response.headers["Operation-Location"]
            operation_id = operation_location.split("/")[-1]
        except Exception as e:
            print(f"❌ OCR failed for {file_name}: {e}")
            continue

    while True:
        result = azure_client.get_read_result(operation_id)
        if result.status not in ['notStarted', 'running']:
            break
        time.sleep(1)

    if result.status == OperationStatusCodes.succeeded:
        for page in result.analyze_result.read_results:
            for line in page.lines:
                all_text += line.text + "\n"

    # Face detection (person class = 0)
    try:
        img = cv2.imread(full_path)
        if img is None:
            raise Exception("Image could not be loaded.")

        results = yolo_model(img)[0]
        for box, cls in zip(results.boxes.xyxy, results.boxes.cls):
            if int(cls.item()) == 0:
                x1, y1, x2, y2 = map(int, box)
                face_count += 1
                face_img = img[y1:y2, x1:x2]
                face_path = os.path.join(face_output_dir, f"face_{face_count}.jpg")
                cv2.imwrite(face_path, face_img)
                print(f"🖼️ Saved face: {face_path}")

                # Optional view
                plt.imshow(cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB))
                plt.axis('off')
                plt.title(f"Face {face_count}")
                plt.show()

    except Exception as e:
        print(f"⚠️ Face detection failed for {file_name}: {e}")

# Print OCR text
print("\n📜 Combined OCR Text:\n")
print(all_text)

# Gemini prompt
prompt = f"""
Extract all the following fields from the OCR text below. These may appear on Aadhaar, PAN card, or Ration card. Return output as a JSON with null for missing values.

**From Aadhaar:**
- Full Name
- Date of Birth
- Aadhaar Number
- VID
- Address
- Issue Date

**From Ration Card (RD):**
- Ration Card Number (RD Number)
- Caste
- Annual Income

**From PAN Card:**
- PAN Number
- Full Name (as on PAN)
- Father's Name
- Date of Birth (as on PAN)

OCR Text:

{all_text}
"""

try:
    gemini_response = genai_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )
    print("\n🧠 Gemini Extracted Details:\n")
    print(gemini_response.text)
except Exception as e:
    print(f"❌ Gemini API Error: {e}")
