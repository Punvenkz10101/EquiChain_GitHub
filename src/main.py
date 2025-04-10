# STEP 1: Install dependencies
!pip install -q -U google-genai
!pip install -q azure-cognitiveservices-vision-computervision pillow opencv-python-headless
!pip install -q ultralytics

# STEP 2: Import dependencies
import time
import os
import cv2
import numpy as np
from PIL import Image
from google.colab import files
import matplotlib.pyplot as plt
from ultralytics import YOLO
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials
from google import genai

# STEP 3: Azure and Gemini API credentials
AZURE_ENDPOINT = "https://testingequichain.cognitiveservices.azure.com/"
AZURE_KEY = "QhVsvy4xsQeRKc6GyOjpoStvZu8fVZtfh7tvAqNC8UHtdopYOxK2JQQJ99BDACGhslBXJ3w3AAAFACOGaCIK"
GEMINI_API_KEY = "AIzaSyCLTS8qhzI-YgOSjUywmh4ySV2sh_Y26ss"

# STEP 4: Authenticate clients
azure_client = ComputerVisionClient(
    endpoint=AZURE_ENDPOINT,
    credentials=CognitiveServicesCredentials(AZURE_KEY)
)
genai_client = genai.Client(api_key=GEMINI_API_KEY)

# STEP 5: Upload files
print("📤 Upload multiple Aadhaar, PAN, or Ration images (JPEG/PNG/PDF):")
uploaded_files = files.upload()

# STEP 6: Init
all_text = ""
face_count = 0
os.makedirs("faces", exist_ok=True)

# STEP 7: Load YOLOv8 model
yolo_model = YOLO("yolov8n.pt")  # Standard pretrained model

# STEP 8: Process each file
for file_name in uploaded_files:
    print(f"\n🔍 Processing file: {file_name}")

    # OCR via Azure
    with open(file_name, "rb") as image_stream:
        try:
            raw_response = azure_client.read_in_stream(image_stream, language="en", raw=True)
            operation_location = raw_response.headers["Operation-Location"]
            operation_id = operation_location.split("/")[-1]
        except Exception as e:
            print(f"❌ OCR failed for {file_name}: {e}")
            continue

    # Wait for OCR
    while True:
        result = azure_client.get_read_result(operation_id)
        if result.status not in ['notStarted', 'running']:
            break
        time.sleep(1)

    if result.status == OperationStatusCodes.succeeded:
        for page in result.analyze_result.read_results:
            for line in page.lines:
                all_text += line.text + "\n"

    # Face detection (filtering person class)
    try:
        img = cv2.imread(file_name)
        if img is None:
            raise Exception("Image could not be loaded.")

        results = yolo_model(img)[0]
        for box, cls in zip(results.boxes.xyxy, results.boxes.cls):
            class_id = int(cls.item())
            if class_id == 0:  # class 0 is "person" in COCO
                x1, y1, x2, y2 = map(int, box)
                face_count += 1
                face_img = img[y1:y2, x1:x2]
                face_path = f"faces/face_{face_count}.jpg"
                cv2.imwrite(face_path, face_img)
                print(f"🖼️ Saved face: {face_path}")

                # Optional show
                plt.imshow(cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB))
                plt.axis('off')
                plt.title(f"Face {face_count}")
                plt.show()

    except Exception as e:
        print(f"⚠️ Face detection failed for {file_name}: {e}")

# STEP 9: Print OCR text
print("\n📜 Combined OCR Text:\n")
print(all_text)

# STEP 10: Gemini prompt
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

# STEP 11: Gemini output
try:
    gemini_response = genai_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )
    print("\n🧠 Gemini Extracted Details:\n")
    print(gemini_response.text)
except Exception as e:
    print(f"❌ Gemini API Error: {e}")