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
import json
import base64
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
FACES_FOLDER = 'faces'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(FACES_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['FACES_FOLDER'] = FACES_FOLDER

# STEP 3: Azure and Gemini API credentials
AZURE_ENDPOINT = "https://testingequichain.cognitiveservices.azure.com/"
AZURE_KEY = "QhVsvy4xsQeRKc6GyOjpoStvZu8fVZtfh7tvAqNC8UHtdopYOxK2JQQJ99BDACGhslBXJ3w3AAAFACOGaCIK"
GEMINI_API_KEY = "AIzaSyCLTS8qhzI-YgOSjUywmh4ySV2sh_Y26ss"

# STEP 4: Authenticate clients
azure_client = ComputerVisionClient(
    endpoint=AZURE_ENDPOINT,
    credentials=CognitiveServicesCredentials(AZURE_KEY)
)

# Initialize Gemini client
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

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_ocr(file_path):
    """Process OCR using Azure Computer Vision"""
    with open(file_path, "rb") as image_stream:
        try:
            raw_response = azure_client.read_in_stream(image_stream, language="en", raw=True)
            operation_location = raw_response.headers["Operation-Location"]
            operation_id = operation_location.split("/")[-1]
        except Exception as e:
            print(f"OCR failed: {str(e)}")
            return ""

    # Wait for OCR
    while True:
        result = azure_client.get_read_result(operation_id)
        if result.status not in ['notStarted', 'running']:
            break
        time.sleep(1)

    ocr_text = ""
    if result.status == OperationStatusCodes.succeeded:
        for page in result.analyze_result.read_results:
            for line in page.lines:
                ocr_text += line.text + "\n"
    
    return ocr_text

def detect_faces(file_path):
    """Detect faces using YOLO"""
    faces = []
    try:
        img = cv2.imread(file_path)
        if img is None:
            raise Exception("Image could not be loaded.")

        results = yolo_model(img)[0]
        for box, cls in zip(results.boxes.xyxy, results.boxes.cls):
            class_id = int(cls.item())
            if class_id == 0:  # class 0 is "person" in COCO
                x1, y1, x2, y2 = map(int, box)
                face_img = img[y1:y2, x1:x2]
                
                # Save face image
                face_filename = f"face_{len(faces) + 1}.jpg"
                face_path = os.path.join(app.config['FACES_FOLDER'], face_filename)
                cv2.imwrite(face_path, face_img)
                
                # Convert face image to base64 for UI display
                _, buffer = cv2.imencode('.jpg', face_img)
                face_base64 = base64.b64encode(buffer).decode('utf-8')
                faces.append({
                    'filename': face_filename,
                    'base64': face_base64
                })

    except Exception as e:
        print(f"Face detection failed: {e}")
    
    return faces

def extract_info_with_gemini(text):
    """Extract information using Gemini"""
    try:
        prompt = f"""
        Extract all the following fields from the OCR text below. These may appear on Aadhaar, PAN card, or Ration card. Return output as a JSON with null for missing values.

        **From Aadhaar:**
        - Full Name
        - Date of Birth
        - Aadhaar Number
        - VID
        - Address
        - Issue Date
        - Gender

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
        {text}
        """

        gemini_response = genai_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        print("\nRaw Gemini Response:")
        print(gemini_response.text)

        # Parse the response
        try:
            extracted_data = json.loads(gemini_response.text)
        except json.JSONDecodeError:
            print("Trying to fix non-JSON format...")
            import re
            json_start = re.search(r'{', gemini_response.text)
            if json_start:
                extracted_data = json.loads(gemini_response.text[json_start.start():])
            else:
                raise Exception("No JSON object found")

        # Clean the data
        for key in extracted_data:
            if extracted_data[key] is not None:
                extracted_data[key] = extracted_data[key].strip()
            if extracted_data[key] == "":
                extracted_data[key] = None

        print("\nProcessed Extracted Data:")
        print(json.dumps(extracted_data, indent=2))

        return extracted_data

    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        return {}

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    try:
        # Save the uploaded file
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Process OCR
        ocr_text = process_ocr(file_path)
        print("\nOCR Text:")
        print(ocr_text)

        # Detect faces
        faces = detect_faces(file_path)
        print(f"\nDetected {len(faces)} faces")

        # Extract information using Gemini
        extracted_info = extract_info_with_gemini(ocr_text)

        # Prepare response
        response_data = {
            "status": "success",
            "message": "Data extracted successfully",
            "extractedInfo": extracted_info,
            "faces": faces,
            "ocrText": ocr_text
        }

        # Clean up
        os.remove(file_path)

        return jsonify(response_data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/faces/<filename>')
def serve_face(filename):
    return send_from_directory(app.config['FACES_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
