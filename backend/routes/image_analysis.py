from flask import Blueprint, request, jsonify
import os
import uuid
from werkzeug.utils import secure_filename
from services.clip_model import extract_features
from utils.preprocess import preprocess_image

image_analysis_bp = Blueprint('image_analysis', __name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@image_analysis_bp.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
        
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(filepath)
        
        # Preprocess the image
        processed_image = preprocess_image(filepath)
        
        # Extract features using CLIP
        features = extract_features(processed_image)
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'image_id': unique_filename,
            'features': features.tolist() if hasattr(features, 'tolist') else features
        })
    
    return jsonify({'error': 'Invalid file type'}), 400
