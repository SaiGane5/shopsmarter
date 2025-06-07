import numpy as np
import faiss
import pickle
import os
import traceback
from database.models import Product, db
from services.clip_model import extract_features_as_embedding
from sqlalchemy import func, and_, or_, not_
import random

# Paths for storing embeddings and indices
EMBEDDINGS_DIR = 'data/embeddings'
IMAGE_INDEX_PATH = os.path.join(EMBEDDINGS_DIR, 'faiss_index.bin')
PRODUCT_IDS_PATH = os.path.join(EMBEDDINGS_DIR, 'product_ids.npy')

# Global variables for loaded indices
_image_index = None
_image_product_ids = None

def load_faiss_index(index_type='image'):
    """Load FAISS index and product IDs"""
    global _image_index, _image_product_ids
    
    try:
        if _image_index is None:
            print(f"Loading FAISS index from {IMAGE_INDEX_PATH}")
            if os.path.exists(IMAGE_INDEX_PATH) and os.path.exists(PRODUCT_IDS_PATH):
                _image_index = faiss.read_index(IMAGE_INDEX_PATH)
                _image_product_ids = np.load(PRODUCT_IDS_PATH)
                print(f"FAISS index loaded successfully with {_image_index.ntotal} vectors of dimension {_image_index.d}")
            else:
                print("FAISS index files not found. Please run load_data.py first.")
                return None, None
        return _image_index, _image_product_ids
            
    except Exception as e:
        print(f"Error loading FAISS index ({index_type}): {e}")
        traceback.print_exc()
        return None, None

def calculate_primary_color_similarity_score(target_features, product):
    """
    Advanced similarity calculation with PRIMARY COLOR INTELLIGENCE
    """
    try:
        score = 0.0
        
        if not isinstance(target_features, dict):
            return 0.0
        
        product_name = str(product.get('name', '')).lower()
        product_desc = str(product.get('description', '')).lower()
        product_category = str(product.get('category', '')).lower()
        
        # ULTRA-STRICT Gender + Age matching (50% weight)
        target_gender = target_features.get('gender', 'unisex').lower()
        target_age_group = target_features.get('age_group', 'adult').lower()
        person_detected = target_features.get('person_detected', False)
        
        if person_detected and target_gender != 'unisex':
            gender_score = 0
            
            if target_gender == 'men' and target_age_group == 'adult':
                men_indicators = ['men', 'man', 'male', 'guys', 'gentleman']
                if any(indicator in product_name or indicator in product_desc for indicator in men_indicators):
                    gender_score = 1.0
                
                wrong_indicators = ['women', 'woman', 'female', 'ladies', 'girl', 'infant', 'baby', 'kid', 'child', 'teen', 'boy']
                if any(indicator in product_name or indicator in product_desc for indicator in wrong_indicators):
                    gender_score = -1.0
                    
            elif target_gender == 'women' and target_age_group == 'adult':
                women_indicators = ['women', 'woman', 'female', 'ladies', 'girl']
                if any(indicator in product_name or indicator in product_desc for indicator in women_indicators):
                    gender_score = 1.0
                
                wrong_indicators = ['men', 'man', 'male', 'guys', 'infant', 'baby', 'kid', 'child', 'teen', 'boy']
                if any(indicator in product_name or indicator in product_desc for indicator in wrong_indicators):
                    gender_score = -1.0
                    
            elif target_gender == 'kids':
                kids_indicators = ['kids', 'children', 'child', 'boy', 'girl', 'teen']
                if target_age_group in ['child', 'teen']:
                    if any(indicator in product_name or indicator in product_desc for indicator in kids_indicators):
                        gender_score = 1.0
                
                adult_indicators = ['men', 'man', 'women', 'woman', 'adult']
                if any(indicator in product_name or indicator in product_desc for indicator in adult_indicators):
                    gender_score = -0.8
            
            score += gender_score * 0.5
        else:
            score += 0.25
        
        # PRIMARY COLOR MATCHING (35% weight) - MOST CRITICAL FOR VISUAL SIMILARITY
        target_primary_colors = target_features.get('primary_colors', [])
        target_accent_colors = target_features.get('accent_colors', [])
        color_confidence = target_features.get('color_confidence', 0.7)
        
        if target_primary_colors and target_primary_colors != ['unknown']:
            primary_color_score = 0
            
            # PRIORITY 1: Exact primary color matches (highest score)
            for primary_color in target_primary_colors:
                if primary_color.lower() in product_name or primary_color.lower() in product_desc:
                    primary_color_score = 1.0
                    break
            
            # PRIORITY 2: Similar primary color matches
            if primary_color_score == 0:
                for primary_color in target_primary_colors:
                    similar_colors = get_similar_colors(primary_color)
                    for similar in similar_colors:
                        if similar in product_name or similar in product_desc:
                            primary_color_score = 0.8  # Good match but not perfect
                            break
                    if primary_color_score > 0:
                        break
            
            # PRIORITY 3: Check if accent colors appear as primary in product (lower score)
            if primary_color_score == 0 and target_accent_colors:
                for accent_color in target_accent_colors:
                    if accent_color.lower() in product_name or accent_color.lower() in product_desc:
                        primary_color_score = 0.3  # Much lower score for accent color matches
                        break
            
            # Apply color confidence weighting
            primary_color_score *= color_confidence
            score += primary_color_score * 0.35
            
        else:
            # Fallback to old color system for backward compatibility
            target_colors = target_features.get('colors', [])
            if target_colors and target_colors != ['unknown']:
                color_score = 0
                for color in target_colors:
                    if color.lower() in product_name or color.lower() in product_desc:
                        color_score = 1.0
                        break
                    # Check similar colors
                    similar_colors = get_similar_colors(color)
                    for similar in similar_colors:
                        if similar in product_name or similar in product_desc:
                            color_score = 0.8
                            break
                    if color_score > 0:
                        break
                score += color_score * 0.35
        
        # Subcategory matching (10% weight)
        target_subcategory = target_features.get('subcategory', '').lower()
        if target_subcategory and target_subcategory != 'unknown':
            subcategory_score = 0
            if target_subcategory in product_name or target_subcategory in product_category:
                subcategory_score = 1.0
            elif target_subcategory == 't-shirt' and any(term in product_name for term in ['shirt', 'top', 'tee']):
                subcategory_score = 0.9
            elif target_subcategory == 'shirt' and any(term in product_name for term in ['t-shirt', 'polo', 'top']):
                subcategory_score = 0.9
            
            score += subcategory_score * 0.10
        
        # Category matching (5% weight)
        target_main_category = target_features.get('main_category', '').lower()
        if target_main_category and target_main_category != 'unknown':
            if target_main_category in product_category or target_main_category in product_name:
                score += 0.05
        
        return max(score, 0.0)
        
    except Exception as e:
        print(f"Error calculating primary color similarity: {e}")
        return 0.0

def get_similar_colors(color):
    """
    Get similar/related colors for better matching
    """
    color_similarity_map = {
        'yellow': ['mustard', 'golden', 'amber', 'cream', 'beige', 'sand'],
        'red': ['crimson', 'maroon', 'burgundy', 'cherry', 'rose', 'coral'],
        'blue': ['navy', 'azure', 'indigo', 'cobalt', 'teal', 'turquoise'],
        'green': ['forest', 'lime', 'olive', 'emerald', 'mint', 'sage'],
        'black': ['charcoal', 'ebony', 'jet', 'onyx'],
        'white': ['cream', 'ivory', 'pearl', 'snow', 'off-white'],
        'brown': ['tan', 'beige', 'chocolate', 'coffee', 'camel', 'khaki'],
        'gray': ['grey', 'silver', 'charcoal', 'slate'],
        'pink': ['rose', 'coral', 'salmon', 'blush', 'magenta'],
        'purple': ['violet', 'lavender', 'plum', 'magenta', 'indigo'],
        'orange': ['tangerine', 'coral', 'peach', 'amber', 'rust']
    }
    
    return color_similarity_map.get(color.lower(), [])

def filter_products_by_primary_color_criteria(target_features, limit=50):
    """
    Advanced product filtering with PRIMARY COLOR INTELLIGENCE
    """
    try:
        if not isinstance(target_features, dict):
            return []
        
        print(f"Primary color intelligent filtering with features: {target_features}")
        
        # Extract criteria
        target_gender = target_features.get('gender', 'unisex').lower()
        target_age_group = target_features.get('age_group', 'adult').lower()
        target_primary_colors = target_features.get('primary_colors', [])
        target_accent_colors = target_features.get('accent_colors', [])
        target_main_category = target_features.get('main_category', '').lower()
        target_subcategory = target_features.get('subcategory', '').lower()
        person_detected = target_features.get('person_detected', False)
        color_confidence = target_features.get('color_confidence', 0.7)
        
        # Build ultra-strict database query
        query = Product.query
        
        # ULTRA-STRICT Gender + Age filtering (same as before)
        if person_detected and target_gender != 'unisex':
            if target_gender == 'men' and target_age_group == 'adult':
                men_conditions = []
                men_terms = ['men', 'man', 'male', 'guys', 'gentleman']
                for term in men_terms:
                    men_conditions.append(Product.name.ilike(f'%{term}%'))
                    men_conditions.append(Product.description.ilike(f'%{term}%'))
                
                exclusion_terms = ['women', 'woman', 'female', 'ladies', 'girl', 'infant', 'baby', 'kid', 'child', 'teen', 'boy']
                exclusions = []
                for term in exclusion_terms:
                    exclusions.append(not_(Product.name.ilike(f'%{term}%')))
                    exclusions.append(not_(Product.description.ilike(f'%{term}%')))
                
                if men_conditions:
                    query = query.filter(or_(*men_conditions))
                if exclusions:
                    query = query.filter(and_(*exclusions))
                    
            elif target_gender == 'women' and target_age_group == 'adult':
                women_conditions = []
                women_terms = ['women', 'woman', 'female', 'ladies', 'girl']
                for term in women_terms:
                    women_conditions.append(Product.name.ilike(f'%{term}%'))
                    women_conditions.append(Product.description.ilike(f'%{term}%'))
                
                exclusion_terms = ['men', 'man', 'male', 'guys', 'infant', 'baby', 'kid', 'child', 'teen', 'boy']
                exclusions = []
                for term in exclusion_terms:
                    exclusions.append(not_(Product.name.ilike(f'%{term}%')))
                    exclusions.append(not_(Product.description.ilike(f'%{term}%')))
                
                if women_conditions:
                    query = query.filter(or_(*women_conditions))
                if exclusions:
                    query = query.filter(and_(*exclusions))
                    
            elif target_gender == 'kids':
                kids_conditions = []
                kids_terms = ['kids', 'children', 'child', 'boy', 'girl', 'teen']
                if target_age_group in ['child', 'teen']:
                    for term in kids_terms:
                        kids_conditions.append(Product.name.ilike(f'%{term}%'))
                        kids_conditions.append(Product.description.ilike(f'%{term}%'))
                
                if kids_conditions:
                    query = query.filter(or_(*kids_conditions))
            
            print(f"Applied ULTRA-STRICT gender filter for: {target_gender} {target_age_group}")
        
        # PRIMARY COLOR FILTERING (REVOLUTIONARY)
        if target_primary_colors and target_primary_colors != ['unknown']:
            primary_color_conditions = []
            
            # PRIORITY 1: Exact primary color matches
            for primary_color in target_primary_colors:
                primary_color_conditions.append(Product.name.ilike(f'%{primary_color}%'))
                primary_color_conditions.append(Product.description.ilike(f'%{primary_color}%'))
                
                # Add similar colors with high confidence
                if color_confidence > 0.6:
                    similar_colors = get_similar_colors(primary_color)
                    for similar in similar_colors:
                        primary_color_conditions.append(Product.name.ilike(f'%{similar}%'))
                        primary_color_conditions.append(Product.description.ilike(f'%{similar}%'))
            
            # ONLY include accent colors if no primary color matches and confidence is low
            if color_confidence < 0.5 and target_accent_colors:
                print("Low color confidence - including accent colors in search")
                for accent_color in target_accent_colors[:2]:  # Limit to 2 accent colors
                    primary_color_conditions.append(Product.name.ilike(f'%{accent_color}%'))
            
            if primary_color_conditions:
                query = query.filter(or_(*primary_color_conditions))
                print(f"Applied PRIMARY COLOR filter for: {target_primary_colors} (confidence: {color_confidence})")
        
        # Category filtering (same as before)
        if target_main_category and target_main_category != 'unknown':
            category_conditions = [Product.category.ilike(f'%{target_main_category}%')]
            
            if target_subcategory and target_subcategory != 'unknown':
                if target_subcategory == 't-shirt':
                    subcategory_terms = ['t-shirt', 'tshirt', 'tee', 'shirt', 'top']
                elif target_subcategory == 'shirt':
                    subcategory_terms = ['shirt', 't-shirt', 'polo', 'top', 'blouse']
                elif target_subcategory == 'dress':
                    subcategory_terms = ['dress', 'gown', 'frock']
                elif target_subcategory == 'pants':
                    subcategory_terms = ['pants', 'trousers', 'jeans']
                else:
                    subcategory_terms = [target_subcategory]
                
                for term in subcategory_terms:
                    category_conditions.append(Product.name.ilike(f'%{term}%'))
            
            query = query.filter(or_(*category_conditions))
            print(f"Applied category filter for: {target_main_category}/{target_subcategory}")
        
        # Execute query
        products = query.limit(limit * 4).all()
        print(f"Database query returned {len(products)} products")
        
        # Calculate primary color similarity scores
        scored_products = []
        for product in products:
            product_dict = product.to_dict()
            similarity_score = calculate_primary_color_similarity_score(target_features, product_dict)
            
            # Higher threshold for better quality
            if similarity_score > 0.6:  
                scored_products.append((product_dict, similarity_score))
        
        # Sort by similarity score
        scored_products.sort(key=lambda x: x[1], reverse=True)
        
        # Return top products
        result = [product for product, score in scored_products[:limit]]
        print(f"Primary color intelligent filtering: {len(products)} -> {len(result)} highly relevant products")
        
        return result
        
    except Exception as e:
        print(f"Error in primary color filtering: {e}")
        traceback.print_exc()
        return []

def search_similar_products(features_or_embeddings, limit=10, index_type='image'):
    """Enhanced search with PRIMARY COLOR INTELLIGENCE"""
    try:
        print(f"Primary color intelligent search using {index_type} index")
        
        # Priority 1: Primary color intelligent feature-based search
        if isinstance(features_or_embeddings, dict):
            print("Using primary color intelligent filtering")
            feature_filtered_products = filter_products_by_primary_color_criteria(features_or_embeddings, limit * 2)
            
            if len(feature_filtered_products) >= limit:
                print(f"Primary color filtering found {len(feature_filtered_products)} products")
                return [p['id'] for p in feature_filtered_products[:limit]]
        
        # Fallback to FAISS with primary color post-filtering
        print("Using FAISS vector search with primary color post-filtering")
        
        index, product_ids = load_faiss_index(index_type)
        if index is None or product_ids is None:
            print(f"Could not load {index_type} FAISS index")
            return fallback_similarity_search(features_or_embeddings, limit)
        
        # Generate query embedding
        if isinstance(features_or_embeddings, (list, np.ndarray)) and len(features_or_embeddings) == 512:
            query_embedding = np.array(features_or_embeddings, dtype=np.float32).reshape(1, -1)
        else:
            query_embedding = extract_features_as_embedding(features_or_embeddings)
            query_embedding = query_embedding.reshape(1, -1)
        
        faiss.normalize_L2(query_embedding)
        
        # Search with larger limit for filtering
        search_limit = limit * 8
        print(f"Searching for {search_limit} similar products...")
        distances, indices = index.search(query_embedding, search_limit)
        
        # Convert indices to product IDs
        candidate_ids = []
        for idx in indices[0]:
            if 0 <= idx < len(product_ids):
                product_id = int(product_ids[idx])
                candidate_ids.append(product_id)
        
        # Apply primary color post-filtering
        if isinstance(features_or_embeddings, dict):
            print("Applying primary color post-filtering to FAISS results")
            scored_products = []
            
            for product_id in candidate_ids:
                try:
                    product = Product.query.get(product_id)
                    if product:
                        product_dict = product.to_dict()
                        similarity_score = calculate_primary_color_similarity_score(features_or_embeddings, product_dict)
                        if similarity_score > 0.6:  # High threshold
                            scored_products.append((product_id, similarity_score))
                except Exception as e:
                    print(f"Error processing product {product_id}: {e}")
                    continue
            
            scored_products.sort(key=lambda x: x[1], reverse=True)
            final_ids = [pid for pid, score in scored_products[:limit]]
            
            if final_ids:
                print(f"Primary color post-filtering: {len(candidate_ids)} -> {len(final_ids)} products")
                return final_ids
        
        print(f"Returning {min(limit, len(candidate_ids))} product IDs from FAISS")
        return candidate_ids[:limit]
        
    except Exception as e:
        print(f"Error in search_similar_products: {e}")
        traceback.print_exc()
        return fallback_similarity_search(features_or_embeddings, limit)

def find_similar_products(features_or_embeddings, limit=10, index_type='image'):
    """Alias for search_similar_products"""
    return search_similar_products(features_or_embeddings, limit, index_type)

def search_by_image_id(image_id, limit=10, index_type='image'):
    """Search for similar products using an existing product's image with color intelligence"""
    try:
        print(f"Searching by image ID with color intelligence: {image_id}")
        
        product = Product.query.get(image_id)
        if not product:
            print(f"Product {image_id} not found")
            return []
        
        # Enhanced feature extraction with primary color detection
        product_features = {
            'main_category': 'clothing',
            'subcategory': 'item',
            'primary_colors': ['unknown'],
            'accent_colors': [],
            'patterns': ['solid'],
            'style': ['casual'],
            'material': 'unknown',
            'brand': 'unknown',
            'gender': 'unisex',
            'age_group': 'adult',
            'person_detected': False,
            'confidence': 0.5,
            'color_confidence': 0.7
        }
        
        product_name = product.name.lower() if product.name else ''
        product_category = product.category.lower() if product.category else ''
        product_desc = product.description.lower() if product.description else ''
        
        # Enhanced gender detection (same as before)
        if any(term in product_name or term in product_desc for term in ['women', 'woman', 'female', 'ladies', 'girl']):
            product_features['gender'] = 'women'
            product_features['age_group'] = 'adult'
        elif any(term in product_name or term in product_desc for term in ['men', 'man', 'male', 'guys']):
            product_features['gender'] = 'men'
            product_features['age_group'] = 'adult'
        elif any(term in product_name or term in product_desc for term in ['kids', 'children', 'child', 'infant', 'baby', 'boy', 'girl', 'teen']):
            product_features['gender'] = 'kids'
            if any(term in product_name for term in ['infant', 'baby']):
                product_features['age_group'] = 'infant'
            elif any(term in product_name for term in ['child', 'kid']):
                product_features['age_group'] = 'child'
            elif 'teen' in product_name:
                product_features['age_group'] = 'teen'
        
        # Enhanced category detection (same as before)
        if any(term in product_name for term in ['t-shirt', 'tshirt', 'tee']):
            product_features['subcategory'] = 't-shirt'
        elif any(term in product_name for term in ['shirt', 'polo']):
            product_features['subcategory'] = 'shirt'
        elif 'dress' in product_name:
            product_features['subcategory'] = 'dress'
        elif any(term in product_name for term in ['pants', 'jeans', 'trouser']):
            product_features['subcategory'] = 'pants'
        elif any(term in product_name for term in ['shoe', 'sneaker', 'boot']):
            product_features['subcategory'] = 'shoes'
            product_features['main_category'] = 'shoes'
        
        # ENHANCED primary color extraction
        primary_colors = []
        accent_colors = []
        
        colors_to_check = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'grey', 'orange', 'navy', 'maroon']
        
        for color in colors_to_check:
            if color in product_name:
                # First color found is usually primary
                if not primary_colors:
                    primary_colors.append(color)
                else:
                    accent_colors.append(color)
            elif color in product_desc:
                accent_colors.append(color)
        
        if primary_colors:
            product_features['primary_colors'] = primary_colors
        if accent_colors:
            product_features['accent_colors'] = accent_colors[:2]  # Limit to 2 accent colors
        
        # Set backward compatibility
        product_features['colors'] = product_features['primary_colors']
        
        return search_similar_products(product_features, limit, index_type)
        
    except Exception as e:
        print(f"Error in search_by_image_id: {e}")
        traceback.print_exc()
        return []

def get_complementary_products(product, limit=10):
    """Enhanced complementary products with primary color awareness"""
    try:
        if not product:
            return []
        
        print(f"Getting complementary products with color intelligence for {product.name}")
        
        product_name = product.name.lower() if product.name else ''
        product_desc = product.description.lower() if product.description else ''
        
        # Ultra-precise gender detection (same as before)
        gender_context = 'unisex'
        age_context = 'adult'
        
        if any(term in product_name or term in product_desc for term in ['women', 'woman', 'female', 'ladies', 'girl']):
            gender_context = 'women'
        elif any(term in product_name or term in product_desc for term in ['men', 'man', 'male', 'guys']):
            gender_context = 'men'
        elif any(term in product_name or term in product_desc for term in ['kids', 'children', 'child', 'infant', 'baby', 'teen']):
            gender_context = 'kids'
            if any(term in product_name for term in ['infant', 'baby']):
                age_context = 'infant'
            elif any(term in product_name for term in ['child', 'kid']):
                age_context = 'child'
            elif 'teen' in product_name:
                age_context = 'teen'
        
        print(f"Detected context: {gender_context} {age_context}")
        
        # Determine source type (same as before)
        if any(term in product_name for term in ['shirt', 't-shirt', 'top', 'blouse', 'dress', 'sweater', 'hoodie']):
            source_type = 'clothing_top'
        elif any(term in product_name for term in ['pants', 'jeans', 'trouser', 'skirt']):
            source_type = 'clothing_bottom'
        elif any(term in product_name for term in ['shoe', 'sneaker', 'boot', 'sandal']):
            source_type = 'shoes'
        elif any(term in product_name for term in ['bag', 'backpack', 'handbag', 'wallet']):
            source_type = 'accessories'
        else:
            source_type = 'general'
        
        # Build ULTRA-STRICT gender-aware complementary queries (same as before)
        complementary_queries = []
        
        if gender_context == 'women' and age_context == 'adult':
            if source_type == 'clothing_top':
                complementary_queries = [
                    and_(Product.name.ilike('%women%'), or_(Product.name.ilike('%pants%'), Product.name.ilike('%skirt%'), Product.name.ilike('%jeans%'))),
                    and_(Product.name.ilike('%women%'), or_(Product.name.ilike('%shoe%'), Product.name.ilike('%sandal%'), Product.name.ilike('%heel%'))),
                    and_(Product.name.ilike('%women%'), or_(Product.name.ilike('%bag%'), Product.name.ilike('%handbag%'), Product.name.ilike('%purse%')))
                ]
            elif source_type == 'clothing_bottom':
                complementary_queries = [
                    and_(Product.name.ilike('%women%'), or_(Product.name.ilike('%shirt%'), Product.name.ilike('%top%'), Product.name.ilike('%blouse%'))),
                    and_(Product.name.ilike('%women%'), or_(Product.name.ilike('%shoe%'), Product.name.ilike('%sandal%'), Product.name.ilike('%heel%'))),
                    and_(Product.name.ilike('%women%'), or_(Product.name.ilike('%bag%'), Product.name.ilike('%jewelry%')))
                ]
                
        elif gender_context == 'men' and age_context == 'adult':
            if source_type == 'clothing_top':
                complementary_queries = [
                    and_(Product.name.ilike('%men%'), or_(Product.name.ilike('%pants%'), Product.name.ilike('%jeans%'), Product.name.ilike('%trouser%'))),
                    and_(Product.name.ilike('%men%'), or_(Product.name.ilike('%shoe%'), Product.name.ilike('%sneaker%'), Product.name.ilike('%boot%'))),
                    and_(Product.name.ilike('%men%'), or_(Product.name.ilike('%belt%'), Product.name.ilike('%watch%'), Product.name.ilike('%wallet%')))
                ]
            elif source_type == 'clothing_bottom':
                complementary_queries = [
                    and_(Product.name.ilike('%men%'), or_(Product.name.ilike('%shirt%'), Product.name.ilike('%t-shirt%'), Product.name.ilike('%polo%'))),
                    and_(Product.name.ilike('%men%'), or_(Product.name.ilike('%shoe%'), Product.name.ilike('%sneaker%'), Product.name.ilike('%boot%'))),
                    and_(Product.name.ilike('%men%'), or_(Product.name.ilike('%belt%'), Product.name.ilike('%watch%')))
                ]
                
        elif gender_context == 'kids':
            complementary_queries = [
                and_(or_(Product.name.ilike('%kids%'), Product.name.ilike('%children%'), Product.name.ilike('%child%')), 
                     Product.category.ilike('%clothing%')),
                and_(or_(Product.name.ilike('%kids%'), Product.name.ilike('%children%'), Product.name.ilike('%child%')), 
                     Product.category.ilike('%shoes%'))
            ]
        else:
            # Unisex - but still avoid wrong categories
            complementary_queries = [
                and_(not_(Product.name.ilike('%infant%')), not_(Product.name.ilike('%baby%')), Product.category.ilike('%clothing%')),
                and_(not_(Product.name.ilike('%infant%')), not_(Product.name.ilike('%baby%')), Product.category.ilike('%shoes%'))
            ]
        
        # Execute queries with strict exclusions (same as before)
        complementary_products = []
        for query_condition in complementary_queries:
            try:
                exclusion_conditions = []
                
                if gender_context == 'men':
                    exclusion_conditions = [
                        not_(Product.name.ilike('%women%')),
                        not_(Product.name.ilike('%female%')),
                        not_(Product.name.ilike('%ladies%')),
                        not_(Product.name.ilike('%girl%')),
                        not_(Product.name.ilike('%infant%')),
                        not_(Product.name.ilike('%baby%'))
                    ]
                elif gender_context == 'women':
                    exclusion_conditions = [
                        not_(Product.name.ilike('%men%')),
                        not_(Product.name.ilike('%male%')),
                        not_(Product.name.ilike('%guys%')),
                        not_(Product.name.ilike('%infant%')),
                        not_(Product.name.ilike('%baby%'))
                    ]
                
                final_query = Product.query.filter(
                    query_condition,
                    Product.id != product.id
                )
                
                if exclusion_conditions:
                    final_query = final_query.filter(and_(*exclusion_conditions))
                
                products = final_query.limit(4).all()
                complementary_products.extend(products)
                
                if len(complementary_products) >= limit:
                    break
                    
            except Exception as e:
                print(f"Error in complementary query: {e}")
                continue
        
        # Remove duplicates
        seen_ids = set()
        unique_products = []
        for p in complementary_products:
            if p.id not in seen_ids:
                unique_products.append(p)
                seen_ids.add(p.id)
                if len(unique_products) >= limit:
                    break
        
        print(f"Found {len(unique_products)} color-intelligent complementary products")
        return unique_products
        
    except Exception as e:
        print(f"Error getting complementary products: {e}")
        traceback.print_exc()
        return []

def fallback_similarity_search(features_or_embeddings, limit=10):
    """Enhanced fallback search with primary color awareness"""
    try:
        print("Using enhanced fallback search with primary color awareness")
        
        if isinstance(features_or_embeddings, dict):
            return [p['id'] for p in filter_products_by_primary_color_criteria(features_or_embeddings, limit)]
        
        # Basic fallback with proper filtering
        all_products = Product.query.filter(
            not_(Product.name.ilike('%infant%')),
            not_(Product.name.ilike('%baby%'))
        ).limit(100).all()
        
        if not all_products:
            return []
        
        random.shuffle(all_products)
        return [p.id for p in all_products[:limit]]
        
    except Exception as e:
        print(f"Error in fallback search: {e}")
        traceback.print_exc()
        return []

def get_index_stats():
    """Get statistics about the loaded indices"""
    try:
        stats = {}
        
        image_index, image_product_ids = load_faiss_index('image')
        if image_index is not None:
            stats['image_index'] = {
                'total_vectors': image_index.ntotal,
                'dimension': image_index.d,
                'product_count': len(image_product_ids) if image_product_ids is not None else 0
            }
        
        stats['primary_color_intelligence'] = True
        stats['color_hierarchy_support'] = True
        
        return stats
        
    except Exception as e:
        print(f"Error getting index stats: {e}")
        return {}
