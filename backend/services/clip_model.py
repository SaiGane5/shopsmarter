import torch
import numpy as np
from PIL import Image
import os
import google.generativeai as genai
from dotenv import load_dotenv
from transformers import CLIPProcessor, CLIPModel
import traceback
import gc
import sys

# Load environment variables
load_dotenv()

# Configure the Gemini API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "AIzaSyBVCjp6cbCEuzWaJB81XHT2afHvX_6bAVI"))

# Global model cache to avoid reloading
_clip_model = None
_clip_processor = None

def get_clip_model():
    """Get cached CLIP model and processor"""
    global _clip_model, _clip_processor
    
    if _clip_model is None or _clip_processor is None:
        print("Loading CLIP model...")
        device = "cpu"  # Force CPU for stability
        
        try:
            _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            _clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
            _clip_model = _clip_model.to(device)
            _clip_model.eval()  # Set to evaluation mode
            print(f"CLIP model loaded successfully on {device}")
        except Exception as e:
            print(f"Error loading CLIP model: {e}")
            traceback.print_exc()
            return None, None
    
    return _clip_model, _clip_processor

def extract_features_as_embedding(features_or_image_path):
    """
    Convert features or image to CLIP embedding (512 dimensions)
    Args:
        features_or_image_path: Dictionary of features or path to image file
    Returns:
        Numpy array of embedding (512 dimensions)
    """
    try:
        # Get cached model
        model, processor = get_clip_model()
        if model is None or processor is None:
            print("Failed to load CLIP model")
            return np.zeros(512, dtype=np.float32)
        
        device = next(model.parameters()).device
        print(f"Using device: {device}")
        
        # Process input
        if isinstance(features_or_image_path, str) and os.path.exists(features_or_image_path):
            # Input is an image path
            print(f"Processing image from path: {features_or_image_path}")
            try:
                image = Image.open(features_or_image_path).convert('RGB')
                inputs = processor(images=image, return_tensors="pt").to(device)
                
                with torch.no_grad():
                    image_features = model.get_image_features(**inputs)
                    embedding = image_features.cpu().numpy()[0]
                    
            except Exception as e:
                print(f"Error processing image: {e}")
                return np.zeros(512, dtype=np.float32)
                
        else:
            # Input is features dictionary, convert to text description
            if isinstance(features_or_image_path, dict):
                print("Processing features as text description")
                try:
                    text_description = create_text_from_features(features_or_image_path)
                    print(f"Generated text description: {text_description}")
                    
                    inputs = processor(text=text_description, return_tensors="pt").to(device)
                    
                    with torch.no_grad():
                        text_features = model.get_text_features(**inputs)
                        embedding = text_features.cpu().numpy()[0]
                        
                except Exception as e:
                    print(f"Error processing text: {e}")
                    return np.zeros(512, dtype=np.float32)
            else:
                print("Invalid input type")
                return np.zeros(512, dtype=np.float32)
        
        # Normalize embedding
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        
        # Ensure correct dtype and shape
        embedding = embedding.astype(np.float32)
        
        # Verify embedding dimension
        if embedding.shape[0] != 512:
            print(f"Warning: Expected 512 dimensions, got {embedding.shape[0]}")
            # Resize to 512 if needed
            if embedding.shape[0] > 512:
                embedding = embedding[:512]
            else:
                padded = np.zeros(512, dtype=np.float32)
                padded[:embedding.shape[0]] = embedding
                embedding = padded
        
        print(f"Generated embedding shape: {embedding.shape}, dtype: {embedding.dtype}")
        return embedding
        
    except Exception as e:
        print(f"Error in extract_features_as_embedding: {e}")
        traceback.print_exc()
        return np.zeros(512, dtype=np.float32)

def create_text_from_features(features):
    """
    Create a descriptive text from features dictionary
    """
    text_parts = []
    
    # Add category information
    main_category = features.get('main_category', '')
    subcategory = features.get('subcategory', '')
    
    if subcategory and main_category:
        text_parts.append(f"A {subcategory} from {main_category} category")
    elif subcategory:
        text_parts.append(f"A {subcategory}")
    elif main_category:
        text_parts.append(f"An item from {main_category} category")
    
    # Add colors
    colors = features.get('colors', [])
    if colors:
        if isinstance(colors, list):
            color_text = ' and '.join(colors)
        else:
            color_text = str(colors)
        text_parts.append(f"with {color_text} colors")
    
    # Add material
    material = features.get('material', '')
    if material and material != 'unknown':
        text_parts.append(f"made of {material}")
    
    # Add patterns
    patterns = features.get('patterns', [])
    if patterns:
        if isinstance(patterns, list):
            pattern_text = ' and '.join(patterns)
        else:
            pattern_text = str(patterns)
        text_parts.append(f"with {pattern_text} patterns")
    
    # Add style
    style = features.get('style', [])
    if style:
        if isinstance(style, list):
            style_text = ' and '.join(style)
        else:
            style_text = str(style)
        text_parts.append(f"in {style_text} style")
    
    # Add brand
    brand = features.get('brand', '')
    if brand and brand != 'unknown':
        text_parts.append(f"from {brand} brand")
    
    # Combine all parts
    if text_parts:
        return ' '.join(text_parts)
    else:
        return "A product item"

def extract_features(image_path):
    """
    Extract features from an image using Google's Gemini API
    Args:
        image_path: Path to the image file
    Returns:
        Dictionary of extracted features
    """
    try:
        # Load the image
        img = Image.open(image_path)
        
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Create a prompt to extract visual features
        prompt = """
        Analyze this image and extract the following features:
        1. Main category (e.g., clothing, electronics, furniture, accessories, shoes, bags)
        2. Subcategory (e.g., shirt, smartphone, sofa, watch, sneakers, backpack)
        3. Colors (list 2-3 dominant colors)
        4. Patterns (if any, e.g., striped, floral, solid, geometric)
        5. Style/design attributes (e.g., casual, formal, modern, vintage, sporty)
        6. Material (if identifiable, e.g., cotton, leather, metal, plastic, wood)
        7. Brand (if visible, otherwise "unknown")
        
        Return the response as a clean JSON object with these exact keys:
        {
            "main_category": "category_name",
            "subcategory": "subcategory_name", 
            "colors": ["color1", "color2"],
            "patterns": ["pattern1"],
            "style": ["style1", "style2"],
            "material": "material_name",
            "brand": "brand_name"
        }
        """
        
        # Generate content with the image
        response = model.generate_content([prompt, img])
        
        # Extract the JSON response
        import json
        import re
        
        response_text = response.text
        print(f"Gemini response: {response_text}")
        
        # Try to find JSON content
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find any JSON object
            json_match = re.search(r'(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                raise ValueError("Could not extract JSON from response")
        
        # Parse the JSON
        features = json.loads(json_str)
        
        # Validate and clean features
        cleaned_features = {
            "main_category": str(features.get('main_category', 'unknown')).lower(),
            "subcategory": str(features.get('subcategory', 'unknown')).lower(),
            "colors": [str(c).lower() for c in features.get('colors', []) if c],
            "patterns": [str(p).lower() for p in features.get('patterns', []) if p],
            "style": [str(s).lower() for s in features.get('style', []) if s],
            "material": str(features.get('material', 'unknown')).lower(),
            "brand": str(features.get('brand', 'unknown')).lower()
        }
        
        print(f"Extracted and cleaned features: {cleaned_features}")
        return cleaned_features
        
    except Exception as e:
        print(f"Error extracting features: {e}")
        traceback.print_exc()
        
        # Return basic features if extraction fails
        return {
            "main_category": "unknown",
            "subcategory": "unknown", 
            "colors": [],
            "patterns": [],
            "style": [],
            "material": "unknown",
            "brand": "unknown"
        }