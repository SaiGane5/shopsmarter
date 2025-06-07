from flask import Blueprint, request, jsonify
from services.vector_search import find_similar_products, search_by_image_id, get_complementary_products
from services.nlp_agent import refine_recommendations
from database.models import db, Product, User, UserHistory
import numpy as np
import traceback

recommendation_bp = Blueprint('recommendation', __name__)

def validate_and_enhance_features(features):
    """Validate and enhance features with proper defaults"""
    if not isinstance(features, dict):
        return None
    
    # Ensure all required fields exist
    enhanced_features = {
        'main_category': features.get('main_category', 'clothing'),
        'subcategory': features.get('subcategory', 'item'),
        'colors': features.get('colors', ['unknown']),
        'patterns': features.get('patterns', ['solid']),
        'style': features.get('style', ['casual']),
        'material': features.get('material', 'unknown'),
        'brand': features.get('brand', 'unknown'),
        'gender': features.get('gender', 'unisex'),
        'person_detected': features.get('person_detected', False),
        'confidence': features.get('confidence', 0.7)
    }
    
    # Validate gender
    valid_genders = ['women', 'men', 'kids', 'unisex']
    if enhanced_features['gender'] not in valid_genders:
        enhanced_features['gender'] = 'unisex'
    
    return enhanced_features

def log_recommendation_context(features, products_found):
    """Log recommendation context for debugging"""
    try:
        gender = features.get('gender', 'unisex')
        person_detected = features.get('person_detected', False)
        colors = features.get('colors', [])
        subcategory = features.get('subcategory', 'unknown')
        
        print(f"=== RECOMMENDATION CONTEXT ===")
        print(f"Gender: {gender} (Person detected: {person_detected})")
        print(f"Colors: {colors}")
        print(f"Subcategory: {subcategory}")
        print(f"Products found: {products_found}")
        print(f"================================")
        
    except Exception as e:
        print(f"Error logging context: {e}")

@recommendation_bp.route('/similar', methods=['POST'])
def get_similar_products():
    """Get similar products with enhanced gender-aware filtering"""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        similar_product_ids = []
        
        # Handle different types of input
        if 'features' in data:
            # Validate and enhance features
            features = validate_and_enhance_features(data['features'])
            if not features:
                return jsonify({'error': 'Invalid features provided'}), 400
            
            limit = data.get('limit', 10)
            index_type = data.get('index_type', 'image')
            
            print(f"Searching by features using {index_type} index")
            print(f"Enhanced features: {features}")
            
            # Use enhanced search with larger candidate pool
            similar_product_ids = find_similar_products(features, limit=limit*3, index_type=index_type)
            
        elif 'image_id' in data:
            # Search by existing product's image
            image_id = data['image_id']
            limit = data.get('limit', 10)
            index_type = data.get('index_type', 'image')
            
            print(f"Searching by image ID {image_id} using {index_type} index")
            similar_product_ids = search_by_image_id(image_id, limit=limit*2, index_type=index_type)
            
        elif 'image_path' in data:
            # Search by image file path
            image_path = data['image_path']
            limit = data.get('limit', 10)
            
            print(f"Searching by image path: {image_path}")
            similar_product_ids = find_similar_products(image_path, limit=limit*2, index_type='image')
            
        else:
            return jsonify({'error': 'No features, image_id, or image_path provided'}), 400
        
        # Get full product details
        product_details = []
        if similar_product_ids:
            for product_id in similar_product_ids:
                try:
                    product = Product.query.get(product_id)
                    if product:
                        product_dict = product.to_dict()
                        product_details.append(product_dict)
                except Exception as e:
                    print(f"Error getting product {product_id}: {e}")
                    continue
        
        # Log context for debugging
        if 'features' in data:
            log_recommendation_context(data['features'], len(product_details))
        
        # Limit final results
        limit = data.get('limit', 10)
        product_details = product_details[:limit]
        
        # Record user interaction if user_id is provided
        user_id = data.get('user_id')
        if user_id and product_details:
            try:
                user = User.query.get(user_id)
                if user:
                    for product_dict in product_details[:5]:
                        history = UserHistory(
                            user_id=user_id,
                            product_id=product_dict['id'],
                            interaction_type='recommendation_view'
                        )
                        db.session.add(history)
                    db.session.commit()
                    print(f"Recorded interactions for user {user_id}")
            except Exception as e:
                print(f"Error recording user interactions: {e}")
        
        print(f"Returning {len(product_details)} gender-aware product recommendations")
        
        return jsonify({
            'recommendations': product_details,
            'total': len(product_details),
            'search_method': 'features' if 'features' in data else 'image_id' if 'image_id' in data else 'image_path',
            'features_used': data.get('features') if 'features' in data else None,
            'gender_context': data['features'].get('gender') if 'features' in data else None,
            'person_detected': data['features'].get('person_detected') if 'features' in data else None
        })
        
    except Exception as e:
        print(f"Error in get_similar_products: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@recommendation_bp.route('/complementary', methods=['POST'])
def complementary():
    """Get complementary products with gender awareness"""
    try:
        data = request.json
        
        if 'product_id' in data:
            product_id = data.get('product_id')
            product = Product.query.get(product_id)
            if not product:
                return jsonify({"error": "Product not found"}), 404
            
            complementary = get_complementary_products(product)
            return jsonify({
                "complementary_products": [p.to_dict() for p in complementary],
                "total": len(complementary),
                "source_product": product.to_dict()
            })
            
        elif 'features' in data:
            # Get complementary products based on enhanced features
            features = validate_and_enhance_features(data['features'])
            if not features:
                return jsonify({'error': 'Invalid features provided'}), 400
            
            limit = data.get('limit', 10)
            
            # Create a mock product for gender-aware complementary search
            mock_product_dict = {
                'name': f"{features.get('gender', 'unisex')} {features.get('subcategory', 'item')}",
                'category': features.get('main_category', 'clothing'),
                'description': f"{features.get('gender', 'unisex')} {' '.join(features.get('colors', []))} {features.get('subcategory', 'item')}"
            }
            
            # Convert to object-like structure for compatibility
            class MockProduct:
                def __init__(self, data):
                    for key, value in data.items():
                        setattr(self, key, value)
                    self.id = 0  # Dummy ID
            
            mock_product = MockProduct(mock_product_dict)
            
            # Get gender-aware complementary products
            complementary = get_complementary_products(mock_product, limit)
            
            return jsonify({
                "complementary_products": [p.to_dict() for p in complementary],
                "total": len(complementary),
                "source_features": features
            })
        
        else:
            return jsonify({"error": "Either product_id or features required"}), 400
            
    except Exception as e:
        print(f"Error in complementary: {e}")
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@recommendation_bp.route('/refine', methods=['POST'])
def refine_results():
    """Refine product recommendations based on user prompt"""
    try:
        data = request.json
        
        if not data or 'products' not in data or 'prompt' not in data:
            return jsonify({'error': 'Missing products or prompt'}), 400
        
        products = data['products']
        prompt = data['prompt']
        
        if not products:
            return jsonify({'error': 'No products provided for refinement'}), 400
        
        print(f"Refining {len(products)} products with prompt: {prompt}")
        
        # Use enhanced NLP to refine recommendations
        refined_products = refine_recommendations(products, prompt)
        
        print(f"Refinement returned {len(refined_products)} products")
        
        return jsonify({
            'recommendations': refined_products,
            'total': len(refined_products),
            'original_count': len(products),
            'prompt': prompt
        })
        
    except Exception as e:
        print(f"Error in refine_results: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@recommendation_bp.route('/status', methods=['GET'])
def get_status():
    """Get the status of the recommendation system"""
    try:
        from services.vector_search import get_index_stats
        import os
        
        status = {
            'faiss_index_exists': os.path.exists('data/embeddings/faiss_index.bin'),
            'image_embeddings_exist': os.path.exists('data/embeddings/image_embeddings.npy'),
            'product_ids_exist': os.path.exists('data/embeddings/product_ids.npy'),
            'gender_aware_filtering': True,
            'advanced_similarity': True
        }
        
        # Get index statistics
        index_stats = get_index_stats()
        status.update(index_stats)
        
        return jsonify(status)
        
    except Exception as e:
        print(f"Error getting status: {e}")
        return jsonify({'error': 'Could not get status', 'details': str(e)}), 500
