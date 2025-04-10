from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.utils import secure_filename
import os
import cv2
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
from ultralytics import YOLO
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials
from google import genai
from datetime import datetime
import base64
from pathlib import Path

app = Flask(__name__)
CORS(app)

# MongoDB setup
client = MongoClient('mongodb://localhost:27017/')
db = client.equichain

# Azure and Gemini API credentials
AZURE_ENDPOINT = "https://testingequichain.cognitiveservices.azure.com/"
AZURE_KEY = "QhVsvy4xsQeRKc6GyOjpoStvZu8fVZtfh7tvAqNC8UHtdopYOxK2JQQJ99BDACGhslBXJ3w3AAAFACOGaCIK"
GEMINI_API_KEY = "AIzaSyCLTS8qhzI-YgOSjUywmh4ySV2sh_Y26ss"

# Initialize clients
azure_client = ComputerVisionClient(
    endpoint=AZURE_ENDPOINT,
    credentials=CognitiveServicesCredentials(AZURE_KEY)
)
genai_client = genai.Client(api_key=GEMINI_API_KEY)

# Initialize YOLO model
yolo_model = YOLO("yolov8n.pt")

# Setup directories
UPLOAD_FOLDER = Path(__file__).parent.parent / 'uploads'
FACES_FOLDER = Path(__file__).parent.parent / 'faces'
UPLOAD_FOLDER.mkdir(exist_ok=True)
FACES_FOLDER.mkdir(exist_ok=True)

def process_file(file_path, user_id):
    """Process a single file for OCR and face detection"""
    all_text = ""
    face_paths = []
    
    # OCR via Azure
    with open(file_path, "rb") as image_stream:
        try:
            raw_response = azure_client.read_in_stream(image_stream, language="en", raw=True)
            operation_location = raw_response.headers["Operation-Location"]
            operation_id = operation_location.split("/")[-1]

            while True:
                result = azure_client.get_read_result(operation_id)
                if result.status not in ['notStarted', 'running']:
                    break
                
            if result.status == OperationStatusCodes.succeeded:
                for page in result.analyze_result.read_results:
                    for line in page.lines:
                        all_text += line.text + "\n"
        except Exception as e:
            print(f"OCR failed: {e}")
            return None, []

    # Face detection
    try:
        img = cv2.imread(str(file_path))
        if img is None:
            raise Exception("Image could not be loaded")

        results = yolo_model(img)
        face_count = 0

        for box, cls in zip(results.boxes.xyxy, results.boxes.cls):
            if int(cls.item()) == 0:  # person class
                x1, y1, x2, y2 = map(int, box)
                face_count += 1
                face_img = img[y1:y2, x1:x2]
                
                # Save face with user_id in filename
                face_filename = f"face_{user_id}_{face_count}.jpg"
                face_path = FACES_FOLDER / face_filename
                cv2.imwrite(str(face_path), face_img)
                face_paths.append(str(face_path))

    except Exception as e:
        print(f"Face detection failed: {e}")

    return all_text, face_paths

def extract_details_with_gemini(text):
    """Extract details using Gemini API"""
    prompt = f"""
    Extract all the following fields from the OCR text below. These may appear on Aadhaar, PAN card, or Ration card. Return output as a JSON with null for missing values.

    Fields to extract:
    - name
    - dob
    - gender
    - aadhaar_number
    - pan_number
    - ration_card_number
    - address
    - father_name
    - photo_id_type

    OCR Text:
    {text}
    """

    try:
        response = genai_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return None

@app.route('/api/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    user_id = request.form.get('userId')
    scheme_id = request.form.get('schemeId')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    # Create user directory if it doesn't exist
    user_dir = UPLOAD_FOLDER / user_id
    user_dir.mkdir(exist_ok=True)

    uploaded_files = []
    extracted_data = []

    for file in files:
        if file.filename:
            # Save file
            filename = secure_filename(file.filename)
            file_path = user_dir / filename
            file.save(file_path)

            # Process file
            ocr_text, face_paths = process_file(file_path, user_id)
            extracted_info = extract_details_with_gemini(ocr_text) if ocr_text else None

            # Store in MongoDB
            file_doc = {
                'userId': user_id,
                'schemeId': scheme_id,
                'originalName': filename,
                'filePath': str(file_path),
                'uploadDate': datetime.utcnow(),
                'ocrText': ocr_text,
                'extractedInfo': extracted_info,
                'facePaths': face_paths
            }
            
            # Save to MongoDB
            result = db.files.insert_one(file_doc)
            
            uploaded_files.append({
                'id': str(result.inserted_id),
                'originalName': filename,
                'extractedInfo': extracted_info
            })

    return jsonify({
        'message': 'Files processed successfully',
        'files': uploaded_files
    })

@app.route('/api/files/<user_id>', methods=['GET'])
def get_user_files(user_id):
    files = list(db.files.find({'userId': user_id}))
    for file in files:
        file['_id'] = str(file['_id'])
    return jsonify(files)

@app.route('/api/download/<file_id>', methods=['GET'])
def download_file(file_id):
    file_doc = db.files.find_one({'_id': file_id})
    if not file_doc:
        return jsonify({'error': 'File not found'}), 404
    return send_file(file_doc['filePath'])

if __name__ == '__main__':
    app.run(port=5000, debug=True)
