import numpy as np
import json
import os
import faiss
import traceback
from database.models import Product
def get_complementary_products(product):
    # Define complementary categories for each main category
    complementary_map = {
        "shirt": ["pants", "jacket", "accessory"],
        "dress": ["shoes", "bag", "jewelry"],
        "sneakers": ["socks", "athletic wear"],
        "sofa": ["lamp", "decor", "table"],
        # Add more as needed
    }
    categories = complementary_map.get(product.category, [])
    # Find products in complementary categories with similar color/style
    return Product.query.filter(
        Product.category.in_(categories),
        # Product.gender == product.gender,
        Product.id != product.id
    ).limit(8).all()
def load_faiss_index(index_path='data/embeddings/faiss_index.bin'):
    """
    Load FAISS index for similarity search
    """
    try:
        if os.path.exists(index_path):
            print(f"Loading FAISS index from {index_path}")
            index = faiss.read_index(index_path)
            print(f"FAISS index loaded successfully with {index.ntotal} vectors of dimension {index.d}")
            
            # Set search parameters for different index types
            if hasattr(index, 'nprobe'):
                index.nprobe = min(10, max(1, index.nlist // 10))
                print(f"Set nprobe to {index.nprobe}")
            elif hasattr(index, 'hnsw'):
                index.hnsw.efSearch = 50
                print("Set HNSW efSearch to 50")
            
            return index
        else:
            print(f"FAISS index not found at {index_path}")
            return None
    except Exception as e:
        print(f"Error loading FAISS index: {e}")
        traceback.print_exc()
        return None

def find_similar_products(features, limit=10, index_type='image'):
    """
    Find similar products based on extracted features
    Args:
        features: Dictionary of extracted features or image path
        limit: Maximum number of products to return
        index_type: 'image' or 'text' to specify which index to use
    Returns:
        List of product IDs
    """
    # Determine which index and embeddings to use
    if index_type == 'image':
        index_path = 'data/embeddings/faiss_index.bin'
        product_ids_path = 'data/embeddings/product_ids.npy'
    else:
        index_path = 'data/embeddings/text_faiss_index.bin'
        product_ids_path = 'data/embeddings/text_product_ids.npy'
    
    # Try FAISS search first
    try:
        index = load_faiss_index(index_path)
        if index and os.path.exists(product_ids_path):
            print(f"Using FAISS {index_type} index for search...")
            
            # Convert features to CLIP embedding
            from services.clip_model import extract_features_as_embedding
            query_embedding = extract_features_as_embedding(features)
            
            # Validate embedding
            if query_embedding is None or np.allclose(query_embedding, 0):
                print("Failed to generate valid query embedding")
                return fallback_search(features, limit)
            
            # Debug information
            print(f"Query embedding shape: {query_embedding.shape}, dtype: {query_embedding.dtype}")
            print(f"Index dimension: {index.d}")
            
            # Ensure correct format for FAISS
            query_embedding = query_embedding.astype(np.float32)
            
            # Normalize embedding (important for cosine similarity)
            norm = np.linalg.norm(query_embedding)
            if norm > 0:
                query_embedding = query_embedding / norm
            
            # Reshape for FAISS (expects 2D array)
            if query_embedding.ndim == 1:
                query_embedding = query_embedding.reshape(1, -1)
            
            # Verify dimensions match
            if query_embedding.shape[1] != index.d:
                print(f"Dimension mismatch: Query {query_embedding.shape[1]} vs Index {index.d}")
                return fallback_search(features, limit)
            
            # Perform search
            print(f"Searching for {limit} similar products...")
            try:
                distances, indices = index.search(query_embedding, limit)
                
                # Debug search results
                print(f"Search completed. Distances: {distances[0][:5]}")
                print(f"Indices: {indices[0][:5]}")
                
                # Load product IDs
                product_ids = np.load(product_ids_path)
                print(f"Loaded {len(product_ids)} product IDs")
                
                # Filter valid indices
                valid_results = []
                for i, idx in enumerate(indices[0]):
                    if 0 <= idx < len(product_ids):
                        product_id = int(product_ids[idx])
                        similarity_score = float(distances[0][i])
                        valid_results.append((product_id, similarity_score))
                
                print(f"Found {len(valid_results)} valid results")
                
                # Sort by similarity (higher is better for cosine similarity)
                valid_results.sort(key=lambda x: x[1], reverse=True)
                
                # Return product IDs
                result_ids = [pid for pid, _ in valid_results]
                
                if result_ids:
                    print(f"Returning {len(result_ids)} product IDs: {result_ids[:5]}...")
                    return result_ids
                else:
                    print("No valid results from FAISS search")
                    
            except Exception as e:
                print(f"Error during FAISS search: {e}")
                traceback.print_exc()
                
    except Exception as e:
        print(f"Error in FAISS search pipeline: {e}")
        traceback.print_exc()
    
    # Fallback to traditional search
    print("Falling back to traditional similarity search")
    return fallback_search(features, limit)

def fallback_search(features, limit=10):
    """
    Fallback similarity search using traditional methods
    """
    try:
        print("Performing fallback similarity search...")
        products = Product.query.all()
        
        if not products:
            print("No products found in database")
            return []
        
        # Calculate similarity scores
        similarity_scores = []
        for product in products:
            try:
                score = calculate_similarity(features, product.features)
                similarity_scores.append((product.id, score))
            except Exception as e:
                print(f"Error calculating similarity for product {product.id}: {e}")
                continue
        
        # Sort by similarity score (descending)
        similarity_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Return top N product IDs
        result = [product_id for product_id, score in similarity_scores[:limit] if score > 0]
        print(f"Fallback search returned {len(result)} products")
        return result
        
    except Exception as e:
        print(f"Error in fallback search: {e}")
        traceback.print_exc()
        return []

def calculate_similarity(features1, features2):
    """
    Calculate similarity between two feature sets
    Args:
        features1: Query features (dict)
        features2: Product features (dict or JSON string)
    Returns:
        Similarity score (0-1)
    """
    try:
        if not features2:
            return 0
        
        # Parse features2 if it's a string
        if isinstance(features2, str):
            try:
                features2 = json.loads(features2)
            except json.JSONDecodeError:
                return 0
        
        if not isinstance(features2, dict):
            return 0
        
        # Initialize score
        score = 0
        total_weight = 0
        
        # Compare main category (highest weight)
        if features1.get('main_category') and features2.get('main_category'):
            if str(features1['main_category']).lower() == str(features2['main_category']).lower():
                score += 0.4
            total_weight += 0.4
        
        # Compare subcategory (high weight)
        if features1.get('subcategory') and features2.get('subcategory'):
            if str(features1['subcategory']).lower() == str(features2['subcategory']).lower():
                score += 0.3
            total_weight += 0.3
        
        # Compare colors (medium weight)
        colors1 = set()
        colors2 = set()
        
        if isinstance(features1.get('colors'), list):
            colors1 = set(str(c).lower() for c in features1['colors'] if c)
        elif features1.get('colors'):
            colors1 = {str(features1['colors']).lower()}
            
        if isinstance(features2.get('colors'), list):
            colors2 = set(str(c).lower() for c in features2['colors'] if c)
        elif features2.get('colors'):
            colors2 = {str(features2['colors']).lower()}
        
        if colors1 and colors2:
            color_similarity = len(colors1.intersection(colors2)) / max(len(colors1), len(colors2))
            score += 0.15 * color_similarity
        total_weight += 0.15
        
        # Compare material (medium weight)
        if features1.get('material') and features2.get('material'):
            if (str(features1['material']).lower() == str(features2['material']).lower() and 
                features1['material'] != 'unknown'):
                score += 0.1
        total_weight += 0.1
        
        # Compare brand (low weight)
        if features1.get('brand') and features2.get('brand'):
            if (str(features1['brand']).lower() == str(features2['brand']).lower() and 
                features1['brand'] != 'unknown'):
                score += 0.05
        total_weight += 0.05
        
        # Normalize score
        if total_weight > 0:
            score = score / total_weight
        
        return min(score, 1.0)  # Cap at 1.0
        
    except Exception as e:
        print(f"Error calculating similarity: {e}")
        return 0

def search_by_image_id(image_id, limit=10, index_type='image'):
    """
    Find similar products using an existing product's image embedding
    Args:
        image_id: Product ID to use as reference
        limit: Maximum number of products to return
        index_type: 'image' or 'text' index type
    Returns:
        List of similar product IDs
    """
    try:
        # Determine paths
        if index_type == 'image':
            index_path = 'data/embeddings/faiss_index.bin'
            embeddings_path = 'data/embeddings/image_embeddings.npy'
            product_ids_path = 'data/embeddings/product_ids.npy'
        else:
            index_path = 'data/embeddings/text_faiss_index.bin'
            embeddings_path = 'data/embeddings/text_embeddings.npy'
            product_ids_path = 'data/embeddings/text_product_ids.npy'
        
        # Load components
        index = load_faiss_index(index_path)
        if not index:
            print(f"Could not load {index_type} index")
            return []
        
        if not os.path.exists(embeddings_path) or not os.path.exists(product_ids_path):
            print(f"Missing {index_type} embeddings or product IDs")
            return []
        
        # Load embeddings and product IDs
        embeddings = np.load(embeddings_path)
        product_ids = np.load(product_ids_path)
        
        # Find the embedding for the given image_id
        try:
            image_idx = np.where(product_ids == image_id)[0]
            if len(image_idx) == 0:
                print(f"Product ID {image_id} not found in embeddings")
                return []
            
            image_idx = image_idx[0]
            query_embedding = embeddings[image_idx].astype(np.float32)
            
            # Normalize
            norm = np.linalg.norm(query_embedding)
            if norm > 0:
                query_embedding = query_embedding / norm
            
            # Reshape for search
            query_embedding = query_embedding.reshape(1, -1)
            
            print(f"Found embedding for product {image_id}, searching for similar products...")
            
            # Search for similar products
            distances, indices = index.search(query_embedding, limit + 1)  # +1 to account for self-match
            
            # Filter out the query product itself and invalid indices
            similar_ids = []
            for i, idx in enumerate(indices[0]):
                if 0 <= idx < len(product_ids):
                    pid = int(product_ids[idx])
                    if pid != image_id:  # Exclude self
                        similar_ids.append(pid)
                        if len(similar_ids) >= limit:
                            break
            
            print(f"Found {len(similar_ids)} similar products")
            return similar_ids
            
        except Exception as e:
            print(f"Error finding similar products by image ID: {e}")
            return []
            
    except Exception as e:
        print(f"Error in search_by_image_id: {e}")
        traceback.print_exc()
        return []

def rebuild_indices():
    """
    Rebuild all FAISS indices with consistent CLIP embeddings
    """
    print("Rebuilding FAISS indices with CLIP embeddings...")
    
    try:
        # Import the updated embedding service
        from services.embedding_service import generate_image_embeddings_clip, generate_text_embeddings_clip, create_faiss_index
        
        # You'll need to pass your products DataFrame here
        # This is a placeholder - you should call this function with your actual data
        print("Note: You need to call this function with your products DataFrame")
        print("Example usage:")
        print("from services.vector_search import rebuild_indices")
        print("rebuild_indices(products_df)")
        
    except Exception as e:
        print(f"Error rebuilding indices: {e}")
        traceback.print_exc()

def rebuild_indices_with_data(products_df):
    """
    Rebuild all FAISS indices with consistent CLIP embeddings
    Args:
        products_df: DataFrame containing product data
    """
    print("Rebuilding FAISS indices with CLIP embeddings...")
    
    try:
        from services.embedding_service import generate_image_embeddings_clip, generate_text_embeddings_clip, create_faiss_index
        
        # Generate image embeddings
        print("Generating image embeddings...")
        image_embeddings, image_product_ids = generate_image_embeddings_clip(products_df)
        
        if image_embeddings is not None:
            # Create image FAISS index
            print("Creating image FAISS index...")
            image_index = create_faiss_index(image_embeddings, 'data/embeddings/faiss_index.bin')
            if image_index:
                print("Image index created successfully")
        
        # Generate text embeddings
        print("Generating text embeddings...")
        text_embeddings, text_product_ids = generate_text_embeddings_clip(products_df)
        
        if text_embeddings is not None:
            # Create text FAISS index
            print("Creating text FAISS index...")
            text_index = create_faiss_index(text_embeddings, 'data/embeddings/text_faiss_index.bin')
            if text_index:
                print("Text index created successfully")
        
        print("Index rebuilding completed!")
        
    except Exception as e:
        print(f"Error rebuilding indices: {e}")
        traceback.print_exc()