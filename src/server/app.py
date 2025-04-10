import os
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials
from ultralytics import YOLO
import google.generativeai as genai
from dotenv import load_dotenv
import cv2
import json
from datetime import datetime
from bson import ObjectId

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
FACES_FOLDER = 'faces'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(FACES_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize MongoDB client
mongo_client = MongoClient(os.getenv('MONGODB_URI'))
db = mongo_client['equichain']

# Initialize Azure Computer Vision client
azure_client = ComputerVisionClient(
    endpoint=os.getenv('AZURE_ENDPOINT'),
    credentials=CognitiveServicesCredentials(os.getenv('AZURE_KEY'))
)

# Initialize Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')

# Initialize YOLO
yolo_model = YOLO("yolov8n.pt")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_ocr(file_path):
    """Process OCR using Azure Computer Vision"""
    print(f"\nProcessing OCR for file: {file_path}")
    with open(file_path, "rb") as image_stream:
        raw_response = azure_client.read_in_stream(image_stream, language="en", raw=True)
        operation_location = raw_response.headers["Operation-Location"]
        operation_id = operation_location.split("/")[-1]

    while True:
        result = azure_client.get_read_result(operation_id)
        if result.status not in ['notStarted', 'running']:
            break
        time.sleep(1)

    if result.status == OperationStatusCodes.succeeded:
        all_text = ""
        for page in result.analyze_result.read_results:
            for line in page.lines:
                all_text += line.text + "\n"
        print(f"OCR Text extracted: {all_text[:100]}...")  # Print first 100 chars
        return all_text
    print("OCR processing failed")
    return ""

def detect_faces(file_path):
    """Detect faces using YOLOv8"""
    faces = []
    try:
        img = cv2.imread(file_path)
        if img is None:
            return faces
        
        results = yolo_model(img)[0]
        for box, cls in zip(results.boxes.xyxy, results.boxes.cls):
            class_id = int(cls.item())
            if class_id == 0:  # class 0 is "person" in COCO
                x1, y1, x2, y2 = map(int, box)
                face_count = len(faces) + 1
                face_img = img[y1:y2, x1:x2]
                face_path = f"face_{face_count}.jpg"
                cv2.imwrite(os.path.join(FACES_FOLDER, face_path), face_img)
                faces.append(face_path)
    except Exception as e:
        print(f"Face detection error: {e}")
    return faces

def extract_info_with_gemini(ocr_text):
    # Print OCR text for debugging
    print("\nOCR Text for Analysis:")
    print("=" * 50)
    print(ocr_text)
    print("=" * 50)

    prompt = f"""
    Extract the following information from the document OCR text. Return a JSON object with the extracted values.
    If a value is not found, return null for that field.

    OCR Text:
    {ocr_text}

    Required fields and extraction instructions:
    {{
        "Personal Information": {{
            "Full Name": "extract the full name (look for patterns like 'Name:', 'Full Name:', or text before 'DOB:')",
            "Date of Birth": "extract date of birth in DD/MM/YYYY format (look for 'DOB:', 'Date of Birth:', or similar patterns)",
            "Age": "calculate age from date of birth",
            "Gender": "extract gender (look for 'Gender:', 'Sex:', or M/F indicators)",
            "Mobile Number": "extract the mobile number (look for 10-digit numbers, patterns like 'Mobile:', 'Phone:')",
            "Father's Name": "extract father's name (look for 'Father:', 'Father's Name:', or similar patterns)",
            "Caste": "extract caste information (look for 'Caste:', 'Category:', or similar terms)"
        }},
        "Aadhaar Details": {{
            "Aadhaar Number": "extract the 12-digit Aadhaar number (look for 12 digits in groups of 4)",
            "VID": "extract the 16-digit VID number (look for 16 digits after 'VID:')",
            "Address": "extract the complete address (look for text after 'Address:', 'C/O:', or similar patterns)",
            "Issue Date": "extract the issue date in DD/MM/YYYY format (look for 'Issue Date:', 'Date of Issue:', or similar patterns)"
        }},
        "PAN Details": {{
            "PAN Number": "extract the Permanent Account Number (look for 'Permanent Account Number' or 'PAN' followed by 10 characters in format AAAAA9999A, or 5 letters followed by 4 numbers and 1 letter)"
        }},
        "Financial Information": {{
            "Annual Income": "extract the annual income (look for patterns like 'Annual Income:', 'Income:', 'Rs.', 'INR', '₹', or numbers followed by 'per annum', 'p.a.', 'PA', 'Lakh', 'Lac', 'Crore')"
        }}
    }}

    Instructions:
    1. Look for patterns in the text carefully
    2. Clean the extracted text by removing extra spaces and special characters
    3. Format dates consistently in DD/MM/YYYY format
    4. Format income as a number without currency symbols
    5. Return a valid JSON object with all required fields
    6. If a field cannot be found, set it to null
    7. Calculate age from date of birth if available
    8. For PAN number, look for:
       - 10 characters in format AAAAA9999A
       - Text after 'Permanent Account Number' or 'PAN'
       - 5 letters followed by 4 numbers and 1 letter
    9. For income, look for:
       - Numbers followed by 'Lakh', 'Lac', 'Crore'
       - Currency symbols (₹, Rs., INR)
       - Terms like 'per annum', 'p.a.', 'PA'
       - Convert all amounts to numbers (e.g., '5 Lakh' to '500000')
    """

    try:
        response = model.generate_content(prompt)
        print("\nGemini Response:")
        print("=" * 50)
        print(response.text)
        print("=" * 50)
        
        # Parse the response text to extract the JSON
        response_text = response.text
        # Find the JSON object in the response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        if start_idx != -1 and end_idx != -1:
            json_str = response_text[start_idx:end_idx]
            extracted_data = json.loads(json_str)
            
            # Clean and standardize the data
            for section in extracted_data:
                for key, value in extracted_data[section].items():
                    if isinstance(value, str):
                        extracted_data[section][key] = value.strip()
                    if value == "":
                        extracted_data[section][key] = None
                    
                    # Format income if present
                    if key == "Annual Income" and value:
                        # Remove currency symbols and convert to standard format
                        value = value.replace('₹', '').replace('Rs.', '').replace('INR', '').strip()
                        # Remove 'per annum' or similar text
                        value = value.split('per')[0].strip()
                        # Convert Lakh/Lac to numbers
                        if 'Lakh' in value or 'Lac' in value:
                            value = value.replace('Lakh', '').replace('Lac', '').strip()
                            value = str(float(value) * 100000)
                        elif 'Crore' in value:
                            value = value.replace('Crore', '').strip()
                            value = str(float(value) * 10000000)
                        extracted_data[section][key] = value
            
            print("\nProcessed Extracted Data:")
            print("=" * 50)
            print(json.dumps(extracted_data, indent=2))
            print("=" * 50)
            return extracted_data
            
        print("No valid JSON found in response")
        return {}
    except Exception as e:
        print(f"Gemini error: {e}")
        return {}

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('file')
    user_id = request.form.get('userId')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    if not files or all(file.filename == '' for file in files):
        return jsonify({'error': 'No selected files'}), 400
    
    try:
        # Create user-specific collection
        user_collection = db[f'user_{user_id}_documents']
        faces_collection = db[f'user_{user_id}_faces']
        
        processed_files = []
        all_faces = []
        combined_ocr_text = ""
        
        for file in files:
            if file and allowed_file(file.filename):
                # Generate unique filename with timestamp
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = secure_filename(file.filename)
                unique_filename = f"{user_id}_{timestamp}_{filename}"
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(file_path)
                
                # Process OCR for each file
                ocr_text = process_ocr(file_path)
                if ocr_text:
                    combined_ocr_text += f"\n\n=== Document: {filename} ===\n{ocr_text}\n"
                
                # Detect faces in each file
                faces = detect_faces(file_path)
                
                # Store faces in MongoDB
                for face_idx, face_img in enumerate(faces):
                    face_filename = f"{user_id}_{timestamp}_face_{face_idx}.jpg"
                    face_path = os.path.join(FACES_FOLDER, face_filename)
                    cv2.imwrite(face_path, face_img)
                    
                    # Store face metadata in MongoDB
                    face_data = {
                        'user_id': user_id,
                        'document_filename': unique_filename,
                        'face_filename': face_filename,
                        'timestamp': datetime.now(),
                        'face_path': face_path
                    }
                    faces_collection.insert_one(face_data)
                    all_faces.append(face_filename)
                
                processed_files.append({
                    'filename': unique_filename,
                    'original_name': filename,
                    'upload_time': datetime.now(),
                    'file_path': file_path
                })
        
        # Extract information using combined OCR text
        extracted_info = extract_info_with_gemini(combined_ocr_text)
        
        # Store document data in MongoDB
        document_data = {
            'user_id': user_id,
            'timestamp': datetime.now(),
            'files': processed_files,
            'faces': all_faces,
            'ocr_text': combined_ocr_text,
            'extracted_info': extracted_info
        }
        
        result = user_collection.insert_one(document_data)
        
        return jsonify({
            'status': 'success',
            'document_id': str(result.inserted_id),
            'files': processed_files,
            'faces': all_faces,
            'extractedInfo': extracted_info,
            'ocrText': combined_ocr_text
        })
        
    except Exception as e:
        print(f"Error processing files: {e}")
        # Clean up uploaded files in case of error
        for processed_file in processed_files:
            try:
                os.remove(processed_file['file_path'])
            except:
                pass
        return jsonify({'error': str(e)}), 500

@app.route('/api/documents/<user_id>', methods=['GET'])
def get_user_documents(user_id):
    try:
        user_collection = db[f'user_{user_id}_documents']
        documents = list(user_collection.find())
        
        # Convert ObjectId and datetime to string for JSON serialization
        for doc in documents:
            doc['_id'] = str(doc['_id'])
            doc['timestamp'] = doc['timestamp'].isoformat()
            for file in doc['files']:
                file['upload_time'] = file['upload_time'].isoformat()
        
        return jsonify(documents)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/documents/<user_id>/<document_id>', methods=['GET'])
def get_document(user_id, document_id):
    try:
        user_collection = db[f'user_{user_id}_documents']
        document = user_collection.find_one({'_id': ObjectId(document_id)})
        
        if document:
            # Convert ObjectId and datetime to string
            document['_id'] = str(document['_id'])
            document['timestamp'] = document['timestamp'].isoformat()
            for file in document['files']:
                file['upload_time'] = file['upload_time'].isoformat()
            return jsonify(document)
            
        return jsonify({'error': 'Document not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/documents/<user_id>/<document_id>', methods=['DELETE'])
def delete_document(user_id, document_id):
    try:
        user_collection = db[f'user_{user_id}_documents']
        faces_collection = db[f'user_{user_id}_faces']
        
        # Get document details
        document = user_collection.find_one({'_id': ObjectId(document_id)})
        
        if document:
            # Delete associated files
            for file in document['files']:
                file_path = file['file_path']
                if os.path.exists(file_path):
                    os.remove(file_path)
            
            # Delete associated faces
            for face in document['faces']:
                # Delete face file
                face_path = os.path.join(FACES_FOLDER, face)
                if os.path.exists(face_path):
                    os.remove(face_path)
                # Delete face record
                faces_collection.delete_many({'face_filename': face})
            
            # Delete document record
            user_collection.delete_one({'_id': ObjectId(document_id)})
            
            return jsonify({'status': 'success', 'message': 'Document and associated data deleted successfully'})
        
        return jsonify({'error': 'Document not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/faces/<filename>')
def serve_face(filename):
    return send_from_directory(FACES_FOLDER, filename)

@app.route('/api/faces/<user_id>', methods=['GET'])
def get_user_faces(user_id):
    try:
        faces_collection = db[f'user_{user_id}_faces']
        faces = list(faces_collection.find())
        
        # Convert ObjectId and datetime to string
        for face in faces:
            face['_id'] = str(face['_id'])
            face['timestamp'] = face['timestamp'].isoformat()
        
        return jsonify(faces)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting server...")
    app.run(debug=True, port=5000)
