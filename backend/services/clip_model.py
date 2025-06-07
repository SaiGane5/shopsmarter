import torch
import numpy as np
from PIL import Image
import os
import requests
import json
from dotenv import load_dotenv
from transformers import CLIPProcessor, CLIPModel
import traceback
import gc
import sys
import base64
import io
import time
import random

# Load environment variables
load_dotenv()

# OpenRouter configuration - now from environment variables
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENROUTER_URL = os.getenv('OPENROUTER_URL')

# Validate that required environment variables are loaded
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in environment variables")


# Rate limiting configuration
MAX_RETRIES = 3
BASE_DELAY = 2
MAX_DELAY = 60

# Global model cache to avoid reloading
_clip_model = None
_clip_processor = None
_model_loading = False

def exponential_backoff_delay(attempt):
    """Calculate delay for exponential backoff with jitter"""
    delay = min(BASE_DELAY * (2 ** attempt) + random.uniform(0, 1), MAX_DELAY)
    return delay

def get_clip_model():
    """Get cached CLIP model and processor with thread safety"""
    global _clip_model, _clip_processor, _model_loading
    
    if _clip_model is not None and _clip_processor is not None:
        return _clip_model, _clip_processor
    
    if _model_loading:
        while _model_loading:
            time.sleep(0.1)
        return _clip_model, _clip_processor
    
    _model_loading = True
    
    try:
        print("Loading CLIP model (one-time initialization)...")
        device = "cpu"
        
        _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        _clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _clip_model = _clip_model.to(device)
        _clip_model.eval()
        print(f"CLIP model loaded successfully on {device}")
        
    except Exception as e:
        print(f"Error loading CLIP model: {e}")
        traceback.print_exc()
        _clip_model = None
        _clip_processor = None
    finally:
        _model_loading = False
    
    return _clip_model, _clip_processor

def image_to_base64(image_path):
    """Convert image to base64 for OpenRouter API"""
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        print(f"Error converting image to base64: {e}")
        return None

def make_openrouter_request_with_retry(data, max_retries=MAX_RETRIES):
    """Make OpenRouter request with exponential backoff"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://shopsmarter.ai",
        "X-Title": "ShopSmarter AI"
    }
    
    for attempt in range(max_retries + 1):
        try:
            response = requests.post(OPENROUTER_URL, headers=headers, data=json.dumps(data), timeout=45)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                if attempt < max_retries:
                    delay = exponential_backoff_delay(attempt)
                    print(f"Rate limited. Waiting {delay:.2f} seconds before retry {attempt + 1}/{max_retries}")
                    time.sleep(delay)
                    continue
                else:
                    print("Max retries reached for rate limiting")
                    return None
            else:
                print(f"OpenRouter API error: {response.status_code} - {response.text}")
                return None
                    
        except requests.exceptions.Timeout:
            if attempt < max_retries:
                delay = exponential_backoff_delay(attempt)
                print(f"Request timeout. Waiting {delay:.2f} seconds before retry {attempt + 1}/{max_retries}")
                time.sleep(delay)
                continue
            else:
                print("Max retries reached for timeout")
                return None
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return None
    
    return None

def analyze_color_hierarchy(colors_detected):
    """
    Analyze detected colors to determine primary vs accent colors
    """
    try:
        if not colors_detected or not isinstance(colors_detected, dict):
            return {"primary_colors": ["unknown"], "accent_colors": []}
        
        primary_colors = colors_detected.get('primary_colors', [])
        accent_colors = colors_detected.get('accent_colors', [])
        
        # If no primary colors specified, treat first color as primary
        if not primary_colors and accent_colors:
            primary_colors = [accent_colors[0]]
            accent_colors = accent_colors[1:]
        elif not primary_colors:
            primary_colors = ["unknown"]
        
        return {
            "primary_colors": primary_colors,
            "accent_colors": accent_colors
        }
        
    except Exception as e:
        print(f"Error analyzing color hierarchy: {e}")
        return {"primary_colors": ["unknown"], "accent_colors": []}

def extract_features_fallback(image_path):
    """Enhanced fallback feature extraction with color intelligence"""
    try:
        print("Using enhanced fallback feature extraction...")
        
        img = Image.open(image_path)
        filename = os.path.basename(image_path).lower()
        
        # Enhanced categorization
        gender = "unisex"
        main_category = "clothing"
        subcategory = "item"
        
        if any(word in filename for word in ['women', 'woman', 'girl', 'female', 'ladies']):
            gender = "women"
        elif any(word in filename for word in ['men', 'man', 'boy', 'male', 'guys']):
            gender = "men"
        
        if any(word in filename for word in ['shirt', 'top', 'blouse', 'tee']):
            main_category = "clothing"
            subcategory = "shirt"
        elif any(word in filename for word in ['pant', 'jean', 'trouser']):
            main_category = "clothing"
            subcategory = "pants"
        elif any(word in filename for word in ['dress', 'gown']):
            main_category = "clothing"
            subcategory = "dress"
            gender = "women"
        elif any(word in filename for word in ['shoe', 'sneaker', 'boot']):
            main_category = "shoes"
            subcategory = "sneakers"
        
        return {
            "main_category": main_category,
            "subcategory": subcategory,
            "primary_colors": ["unknown"],
            "accent_colors": [],
            "patterns": ["solid"],
            "style": ["casual"],
            "material": "unknown",
            "brand": "unknown",
            "gender": gender,
            "person_detected": False,
            "confidence": 0.3,
            "age_group": "adult",
            "color_confidence": 0.3
        }
        
    except Exception as e:
        print(f"Error in fallback extraction: {e}")
        return {
            "main_category": "clothing",
            "subcategory": "item", 
            "primary_colors": ["unknown"],
            "accent_colors": [],
            "patterns": ["solid"],
            "style": ["casual"],
            "material": "unknown",
            "brand": "unknown",
            "gender": "unisex",
            "person_detected": False,
            "confidence": 0.1,
            "age_group": "adult",
            "color_confidence": 0.1
        }

def extract_features_as_embedding(features_or_image_path):
    """Convert features or image to CLIP embedding with color intelligence"""
    try:
        model, processor = get_clip_model()
        if model is None or processor is None:
            print("Failed to load CLIP model")
            return np.zeros(512, dtype=np.float32)
        
        device = next(model.parameters()).device
        
        if isinstance(features_or_image_path, str) and os.path.exists(features_or_image_path):
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
            if isinstance(features_or_image_path, dict):
                try:
                    text_description = create_text_from_features_with_color_intelligence(features_or_image_path)
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
        
        embedding = embedding.astype(np.float32)
        
        if embedding.shape[0] != 512:
            print(f"Warning: Expected 512 dimensions, got {embedding.shape[0]}")
            if embedding.shape[0] > 512:
                embedding = embedding[:512]
            else:
                padded = np.zeros(512, dtype=np.float32)
                padded[:embedding.shape[0]] = embedding
                embedding = padded
        
        return embedding
        
    except Exception as e:
        print(f"Error in extract_features_as_embedding: {e}")
        traceback.print_exc()
        return np.zeros(512, dtype=np.float32)

def create_text_from_features_with_color_intelligence(features):
    """Create enhanced descriptive text with primary color prioritization"""
    text_parts = []
    
    # Gender context (MOST IMPORTANT)
    gender = features.get('gender', 'unisex')
    age_group = features.get('age_group', 'adult')
    
    if gender and gender != 'unisex':
        if age_group == 'adult':
            text_parts.append(f"{gender} adult")
        else:
            text_parts.append(f"{gender} {age_group}")
    
    # Category information
    main_category = features.get('main_category', '')
    subcategory = features.get('subcategory', '')
    
    if subcategory and main_category:
        text_parts.append(f"{subcategory} from {main_category} category")
    elif subcategory:
        text_parts.append(f"{subcategory}")
    elif main_category:
        text_parts.append(f"item from {main_category} category")
    
    # PRIMARY COLOR EMPHASIS (CRITICAL)
    primary_colors = features.get('primary_colors', [])
    accent_colors = features.get('accent_colors', [])
    
    if primary_colors and primary_colors != ['unknown']:
        if isinstance(primary_colors, list):
            primary_color_text = ' and '.join(primary_colors)
        else:
            primary_color_text = str(primary_colors)
        text_parts.append(f"primarily {primary_color_text} colored")
        
        # Only mention accent colors if they're significant
        if accent_colors and len(accent_colors) <= 2:  # Don't overwhelm with too many accent colors
            accent_text = ' and '.join(accent_colors[:2])
            text_parts.append(f"with {accent_text} accents")
    else:
        # Fallback to old color system
        colors = features.get('colors', [])
        if colors and colors != ['unknown']:
            if isinstance(colors, list):
                color_text = ' and '.join(colors)
            else:
                color_text = str(colors)
            text_parts.append(f"with {color_text} colors")
    
    # Material
    material = features.get('material', '')
    if material and material != 'unknown':
        text_parts.append(f"made of {material}")
    
    # Patterns
    patterns = features.get('patterns', [])
    if patterns and patterns != ['solid']:
        if isinstance(patterns, list):
            pattern_text = ' and '.join(patterns)
        else:
            pattern_text = str(patterns)
        text_parts.append(f"with {pattern_text} patterns")
    
    # Style
    style = features.get('style', [])
    if style:
        if isinstance(style, list):
            style_text = ' and '.join(style)
        else:
            style_text = str(style)
        text_parts.append(f"in {style_text} style")
    
    # Brand
    brand = features.get('brand', '')
    if brand and brand != 'unknown':
        text_parts.append(f"from {brand} brand")
    
    if text_parts:
        return ' '.join(text_parts)
    else:
        return "A product item"

def extract_features(image_path):
    """
    ULTRA-ADVANCED feature extraction with PRIMARY vs ACCENT color intelligence
    """
    try:
        print(f"Extracting features with color intelligence from image: {image_path}")
        
        image_base64 = image_to_base64(image_path)
        if not image_base64:
            print("Failed to convert image to base64, using fallback")
            return extract_features_fallback(image_path)
        
        # REVOLUTIONARY prompt for sophisticated color analysis
        prompt = """You are an EXPERT fashion color analyst with advanced visual perception. Analyze this image with EXTREME PRECISION to understand COLOR HIERARCHY and VISUAL DOMINANCE.

**CRITICAL COLOR ANALYSIS RULES:**

**1. PRIMARY vs ACCENT COLOR DETECTION (ULTRA IMPORTANT):**
- **PRIMARY COLORS**: The MAIN, DOMINANT colors that cover most of the garment/product
- **ACCENT COLORS**: Small details like text, logos, buttons, trim, patterns, symbols
- Example: Yellow t-shirt with white text → primary: ["yellow"], accent: ["white"]
- Example: Blue jeans with brown belt → primary: ["blue"], accent: ["brown"]
- Example: Red dress with black buttons → primary: ["red"], accent: ["black"]

**2. COLOR DOMINANCE RULES:**
- If 70%+ of item is one color → PRIMARY
- If <30% of item is a color → ACCENT  
- Logos, text, small graphics → ALWAYS ACCENT
- Base fabric color → ALWAYS PRIMARY
- Patterns: dominant pattern color → PRIMARY, minor colors → ACCENT

**3. COMPLEX CASES:**
- Striped shirt: dominant stripe color → PRIMARY, other stripes → ACCENT
- Plaid/checkered: most prominent color → PRIMARY, others → ACCENT
- Printed designs: background color → PRIMARY, print colors → ACCENT

**4. PERSON DETECTION & DEMOGRAPHICS:**
- If ADULT MALE visible → gender: "men", age_group: "adult"
- If ADULT FEMALE visible → gender: "women", age_group: "adult"  
- If TEEN visible → gender: "men"/"women", age_group: "teen"
- If CHILD visible → gender: "kids", age_group: "child"
- If NO PERSON → gender: "unisex", age_group: "adult"

**5. CLOTHING PRECISION:**
- T-shirt/Tee → subcategory: "t-shirt"
- Button shirt → subcategory: "shirt"
- Polo → subcategory: "polo"
- Hoodie/Sweatshirt → subcategory: "hoodie"
- Dress → subcategory: "dress"
- Jeans → subcategory: "jeans"
- Pants → subcategory: "pants"

**6. COLOR CONFIDENCE:**
- High clarity image → color_confidence: 0.9
- Medium clarity → color_confidence: 0.7
- Low clarity/compressed → color_confidence: 0.5

**EXAMPLES:**
- Yellow t-shirt with white Nike logo → primary: ["yellow"], accent: ["white"]
- Blue jeans with brown leather belt → primary: ["blue"], accent: ["brown"]  
- Red dress with black trim → primary: ["red"], accent: ["black"]
- White shirt with blue stripes → primary: ["white"], accent: ["blue"]
- Green hoodie with yellow drawstrings → primary: ["green"], accent: ["yellow"]

Return ONLY this JSON structure:
{
    "main_category": "clothing/shoes/accessories",
    "subcategory": "specific_type",
    "primary_colors": ["dominant_color1", "dominant_color2"],
    "accent_colors": ["accent_color1", "accent_color2"],
    "patterns": ["pattern_type"],
    "style": ["style1"],
    "material": "material_name",
    "brand": "brand_name",
    "gender": "men/women/kids/unisex",
    "age_group": "adult/teen/child/infant",
    "person_detected": true/false,
    "confidence": 0.9,
    "color_confidence": 0.8
}

**CRITICAL**: Be EXTREMELY accurate with PRIMARY vs ACCENT colors - product recommendations depend on this!"""

        data = {
            "model": "google/gemini-2.0-flash-exp:free",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 1200,
            "temperature": 0.02  # Ultra-low for maximum color accuracy
        }

        print("Sending advanced color analysis request to OpenRouter...")
        response_data = make_openrouter_request_with_retry(data)
        
        if not response_data:
            print("API request failed, using fallback feature extraction")
            return extract_features_fallback(image_path)

        response_text = response_data['choices'][0]['message']['content']
        print(f"Gemini 2.0 Flash advanced response: {response_text}")
        
        # Enhanced JSON extraction
        import re
        
        json_match = re.search(r'``````', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_match = re.search(r'(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    json_str = response_text[start_idx:end_idx + 1]
                else:
                    print("Could not extract JSON from response, using fallback")
                    return extract_features_fallback(image_path)
        
        try:
            features = json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}, using fallback")
            return extract_features_fallback(image_path)
        
        # ADVANCED validation and cleaning with color intelligence
        cleaned_features = {
            "main_category": str(features.get('main_category', 'clothing')).lower().strip(),
            "subcategory": str(features.get('subcategory', 'item')).lower().strip(),
            "primary_colors": [str(c).lower().strip() for c in features.get('primary_colors', ['unknown']) if c and str(c).strip()],
            "accent_colors": [str(c).lower().strip() for c in features.get('accent_colors', []) if c and str(c).strip()],
            "patterns": [str(p).lower().strip() for p in features.get('patterns', ['solid']) if p and str(p).strip()],
            "style": [str(s).lower().strip() for s in features.get('style', ['casual']) if s and str(s).strip()],
            "material": str(features.get('material', 'unknown')).lower().strip(),
            "brand": str(features.get('brand', 'unknown')).strip(),
            "gender": str(features.get('gender', 'unisex')).lower().strip(),
            "age_group": str(features.get('age_group', 'adult')).lower().strip(),
            "person_detected": bool(features.get('person_detected', False)),
            "confidence": float(features.get('confidence', 0.7)),
            "color_confidence": float(features.get('color_confidence', 0.7))
        }
        
        # Ensure lists are not empty
        if not cleaned_features['primary_colors']:
            cleaned_features['primary_colors'] = ['unknown']
        if not cleaned_features['patterns']:
            cleaned_features['patterns'] = ['solid']
        if not cleaned_features['style']:
            cleaned_features['style'] = ['casual']
        
        # Validate gender and age values
        valid_genders = ['men', 'women', 'kids', 'unisex']
        if cleaned_features['gender'] not in valid_genders:
            cleaned_features['gender'] = 'unisex'
        
        valid_ages = ['adult', 'teen', 'child', 'infant']
        if cleaned_features['age_group'] not in valid_ages:
            cleaned_features['age_group'] = 'adult'
        
        # Validate color confidence
        cleaned_features['color_confidence'] = max(0.1, min(1.0, cleaned_features['color_confidence']))
        
        # Add backward compatibility for old 'colors' field
        cleaned_features['colors'] = cleaned_features['primary_colors']  # For backward compatibility
        
        print(f"Extracted features with color intelligence: {cleaned_features}")
        return cleaned_features
        
    except Exception as e:
        print(f"Error extracting features: {e}")
        traceback.print_exc()
        print("Using fallback feature extraction")
        return extract_features_fallback(image_path)
