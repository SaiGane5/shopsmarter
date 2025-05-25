from flask import Blueprint, request, jsonify
from services.vector_search import find_similar_products, search_by_image_id, get_complementary_products
from services.nlp_agent import refine_recommendations
from database.models import db, Product, User, UserHistory
import numpy as np
import traceback

recommendation_bp = Blueprint('recommendation', __name__)

@recommendation_bp.route('/complementary', methods=['POST'])
def complementary():
    data = request.json
    product_id = data.get('product_id')
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    complementary = get_complementary_products(product)
    return jsonify({"complementary_products": [p.to_dict() for p in complementary]})

@recommendation_bp.route('/similar', methods=['POST'])
def get_similar_products():
    """
    Get similar products based on features or image ID
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        similar_product_ids = []
        
        # Handle different types of input
        if 'features' in data:
            # Search by extracted features
            features = data['features']
            limit = data.get('limit', 10)
            index_type = data.get('index_type', 'image')  # 'image' or 'text'
            
            print(f"Searching by features using {index_type} index")
            similar_product_ids = find_similar_products(features, limit=limit, index_type=index_type)
            
        elif 'image_id' in data:
            # Search by existing product's image
            image_id = data['image_id']
            limit = data.get('limit', 10)
            index_type = data.get('index_type', 'image')
            
            print(f"Searching by image ID {image_id} using {index_type} index")
            similar_product_ids = search_by_image_id(image_id, limit=limit, index_type=index_type)
            
        elif 'image_path' in data:
            # Search by image file path
            image_path = data['image_path']
            limit = data.get('limit', 10)
            
            print(f"Searching by image path: {image_path}")
            similar_product_ids = find_similar_products(image_path, limit=limit, index_type='image')
            
        else:
            return jsonify({'error': 'No features, image_id, or image_path provided'}), 400
        
        # Record user interaction if user_id is provided
        user_id = data.get('user_id')
        if user_id and similar_product_ids:
            try:
                user = User.query.get(user_id)
                if user:
                    for product_id in similar_product_ids[:5]:  # Record top 5 interactions
                        history = UserHistory(
                            user_id=user_id,
                            product_id=product_id,
                            interaction_type='recommendation_view'
                        )
                        db.session.add(history)
                    db.session.commit()
                    print(f"Recorded interactions for user {user_id}")
            except Exception as e:
                print(f"Error recording user interactions: {e}")
                # Don't fail the request if history recording fails
        
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
        
        print(f"Returning {len(product_details)} product recommendations")
        
        return jsonify({
            'products': product_details,
            'total_found': len(similar_product_ids),
            'search_method': 'features' if 'features' in data else 'image_id' if 'image_id' in data else 'image_path'
        })
        
    except Exception as e:
        print(f"Error in get_similar_products: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@recommendation_bp.route('/refine', methods=['POST'])
def refine_results():
    """
    Refine product recommendations based on user prompt
    """
    try:
        data = request.json
        
        if not data or 'products' not in data or 'prompt' not in data:
            return jsonify({'error': 'Missing products or prompt'}), 400
        
        products = data['products']
        prompt = data['prompt']
        
        if not products:
            return jsonify({'error': 'No products provided for refinement'}), 400
        
        print(f"Refining {len(products)} products with prompt: {prompt}")
        
        # Use NLP to refine recommendations based on user prompt
        refined_products = refine_recommendations(products, prompt)
        
        print(f"Refinement returned {len(refined_products)} products")
        
        return jsonify({
            'products': refined_products,
            'original_count': len(products),
            'refined_count': len(refined_products)
        })
        
    except Exception as e:
        print(f"Error in refine_results: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

@recommendation_bp.route('/hybrid', methods=['POST'])
def hybrid_search():
    """
    Perform hybrid search using both image and text embeddings
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        limit = data.get('limit', 10)
        
        # Get results from both image and text search
        image_results = []
        text_results = []
        
        if 'features' in data:
            features = data['features']
            
            # Search using image embeddings
            try:
                image_results = find_similar_products(features, limit=limit*2, index_type='image')
                print(f"Image search returned {len(image_results)} results")
            except Exception as e:
                print(f"Image search failed: {e}")
            
            # Search using text embeddings
            try:
                text_results = find_similar_products(features, limit=limit*2, index_type='text')
                print(f"Text search returned {len(text_results)} results")
            except Exception as e:
                print(f"Text search failed: {e}")
        
        # Combine and rank results
        combined_results = combine_search_results(image_results, text_results, limit)
        
        # Get product details
        product_details = []
        for product_id in combined_results:
            try:
                product = Product.query.get(product_id)
                if product:
                    product_details.append(product.to_dict())
            except Exception as e:
                print(f"Error getting product {product_id}: {e}")
                continue
        
        print(f"Hybrid search returning {len(product_details)} products")
        
        return jsonify({
            'products': product_details,
            'image_results_count': len(image_results),
            'text_results_count': len(text_results),
            'combined_count': len(combined_results)
        })
        
    except Exception as e:
        print(f"Error in hybrid_search: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

def combine_search_results(image_results, text_results, limit):
    """
    Combine and rank results from image and text search
    """
    try:
        # Create scoring system
        product_scores = {}
        
        # Score image results (higher weight for earlier results)
        for i, product_id in enumerate(image_results):
            score = (len(image_results) - i) / len(image_results) * 0.6  # Image weight: 60%
            product_scores[product_id] = product_scores.get(product_id, 0) + score
        
        # Score text results
        for i, product_id in enumerate(text_results):
            score = (len(text_results) - i) / len(text_results) * 0.4  # Text weight: 40%
            product_scores[product_id] = product_scores.get(product_id, 0) + score
        
        # Sort by combined score
        ranked_products = sorted(product_scores.items(), key=lambda x: x[1], reverse=True)
        
        # Return top results
        return [product_id for product_id, _ in ranked_products[:limit]]
        
    except Exception as e:
        print(f"Error combining search results: {e}")
        # Fallback: return image results first, then text results
        seen = set()
        combined = []
        
        for product_id in image_results + text_results:
            if product_id not in seen:
                combined.append(product_id)
                seen.add(product_id)
                if len(combined) >= limit:
                    break
        
        return combined

@recommendation_bp.route('/status', methods=['GET'])
def get_status():
    """
    Get the status of the recommendation system
    """
    try:
        import os
        
        status = {
            'faiss_index_exists': os.path.exists('data/embeddings/faiss_index.bin'),
            'text_faiss_index_exists': os.path.exists('data/embeddings/text_faiss_index.bin'),
            'image_embeddings_exist': os.path.exists('data/embeddings/image_embeddings.npy'),
            'text_embeddings_exist': os.path.exists('data/embeddings/text_embeddings.npy'),
            'product_ids_exist': os.path.exists('data/embeddings/product_ids.npy'),
            'text_product_ids_exist': os.path.exists('data/embeddings/text_product_ids.npy')
        }
        
        # Get file sizes if they exist
        if status['faiss_index_exists']:
            status['faiss_index_size'] = os.path.getsize('data/embeddings/faiss_index.bin')
        if status['image_embeddings_exist']:
            embeddings = np.load('data/embeddings/image_embeddings.npy')
            status['image_embeddings_shape'] = embeddings.shape
            status['image_embeddings_dtype'] = str(embeddings.dtype)
        
        return jsonify(status)
        
    except Exception as e:
        print(f"Error getting status: {e}")
        return jsonify({'error': 'Could not get status', 'details': str(e)}), 500