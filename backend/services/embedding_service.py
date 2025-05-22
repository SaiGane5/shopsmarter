import torch
import numpy as np
import os
import faiss
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
from database.models import db, Product

def generate_image_embeddings_clip(products_df, batch_size=8):
    """
    Generate image embeddings using CLIP model (512 dimensions)
    """
    print("Generating CLIP image embeddings...")
    
    # Create directories for embeddings
    os.makedirs('data/embeddings', exist_ok=True)
    
    # Load CLIP model
    device = "cpu"  # Force CPU for stability
    print(f"Loading CLIP model on {device}...")
    
    try:
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        model = model.to(device)
        model.eval()
        print("CLIP model loaded successfully")
    except Exception as e:
        print(f"Error loading CLIP model: {e}")
        return None, None
    
    # Filter products with local image paths
    products_with_images = products_df[products_df['local_image_path'].notna()].copy()
    print(f"Found {len(products_with_images)} products with images")
    
    # Generate embeddings
    embeddings = []
    product_ids = []
    failed_count = 0
    
    # Process in batches
    for i in tqdm(range(0, len(products_with_images), batch_size), desc="Processing images"):
        batch = products_with_images.iloc[i:i+batch_size]
        
        for idx, row in batch.iterrows():
            try:
                # Load and process image
                image_path = row['local_image_path']
                if not os.path.exists(image_path):
                    print(f"Image not found: {image_path}")
                    failed_count += 1
                    continue
                
                # Load image
                image = Image.open(image_path).convert('RGB')
                
                # Process with CLIP
                inputs = processor(images=image, return_tensors="pt").to(device)
                
                with torch.no_grad():
                    image_features = model.get_image_features(**inputs)
                    embedding = image_features.cpu().numpy()[0]
                
                # Normalize embedding
                norm = np.linalg.norm(embedding)
                if norm > 0:
                    embedding = embedding / norm
                
                # Ensure correct dtype
                embedding = embedding.astype(np.float32)
                
                # Verify dimension (should be 512 for CLIP)
                if embedding.shape[0] != 512:
                    print(f"Warning: Unexpected embedding dimension {embedding.shape[0]}")
                    continue
                
                embeddings.append(embedding)
                product_ids.append(idx)
                
            except Exception as e:
                print(f"Error processing image {idx}: {e}")
                failed_count += 1
                continue
    
    if not embeddings:
        print("No embeddings generated!")
        return None, None
    
    # Convert to numpy arrays
    embeddings_array = np.array(embeddings, dtype=np.float32)
    product_ids_array = np.array(product_ids)
    
    print(f"Generated {len(embeddings_array)} embeddings, {failed_count} failed")
    print(f"Embedding shape: {embeddings_array.shape}, dtype: {embeddings_array.dtype}")
    
    # Save embeddings
    np.save('data/embeddings/image_embeddings.npy', embeddings_array)
    np.save('data/embeddings/product_ids.npy', product_ids_array)
    
    # Clean up
    del model, processor
    torch.cuda.empty_cache() if torch.cuda.is_available() else None
    
    print(f"Saved CLIP image embeddings for {len(embeddings_array)} products")
    return embeddings_array, product_ids_array

def generate_text_embeddings_clip(products_df, batch_size=16):
    """
    Generate text embeddings using CLIP model (512 dimensions)
    """
    print("Generating CLIP text embeddings...")
    
    # Create directories for embeddings
    os.makedirs('data/embeddings', exist_ok=True)
    
    # Load CLIP model
    device = "cpu"
    print(f"Loading CLIP model on {device}...")
    
    try:
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        model = model.to(device)
        model.eval()
        print("CLIP model loaded successfully")
    except Exception as e:
        print(f"Error loading CLIP model: {e}")
        return None, None
    
    # Prepare text data
    texts = []
    product_ids = []
    
    for idx, row in products_df.iterrows():
        # Create comprehensive text description
        text_parts = []
        
        # Add product name
        if 'name' in row and pd.notna(row['name']):
            text_parts.append(str(row['name']))
        elif 'product_name' in row and pd.notna(row['product_name']):
            text_parts.append(str(row['product_name']))
        
        # Add brand
        if 'brand' in row and pd.notna(row['brand']):
            text_parts.append(f"Brand: {row['brand']}")
        elif 'brand_name' in row and pd.notna(row['brand_name']):
            text_parts.append(f"Brand: {row['brand_name']}")
        
        # Add category
        if 'category' in row and pd.notna(row['category']):
            text_parts.append(f"Category: {row['category']}")
        elif 'main_category' in row and pd.notna(row['main_category']):
            text_parts.append(f"Category: {row['main_category']}")
        
        # Add description
        if 'description' in row and pd.notna(row['description']):
            desc = str(row['description'])[:200]  # Limit description length
            text_parts.append(desc)
        elif 'about_product' in row and pd.notna(row['about_product']):
            desc = str(row['about_product'])[:200]
            text_parts.append(desc)
        
        # Combine text parts
        if text_parts:
            text = ' '.join(text_parts)
            texts.append(text)
            product_ids.append(idx)
    
    if not texts:
        print("No text data found!")
        return None, None
    
    print(f"Processing {len(texts)} text descriptions")
    
    # Generate embeddings in batches
    all_embeddings = []
    
    for i in tqdm(range(0, len(texts), batch_size), desc="Processing text"):
        batch_texts = texts[i:i+batch_size]
        
        try:
            # Process batch
            inputs = processor(text=batch_texts, return_tensors="pt", padding=True, truncation=True).to(device)
            
            with torch.no_grad():
                text_features = model.get_text_features(**inputs)
                batch_embeddings = text_features.cpu().numpy()
            
            # Normalize each embedding
            for embedding in batch_embeddings:
                norm = np.linalg.norm(embedding)
                if norm > 0:
                    embedding = embedding / norm
                embedding = embedding.astype(np.float32)
                all_embeddings.append(embedding)
                
        except Exception as e:
            print(f"Error processing text batch {i}: {e}")
            # Add zero embeddings for failed batch
            for _ in batch_texts:
                all_embeddings.append(np.zeros(512, dtype=np.float32))
    
    # Convert to numpy array
    embeddings_array = np.array(all_embeddings, dtype=np.float32)
    product_ids_array = np.array(product_ids)
    
    print(f"Generated {len(embeddings_array)} text embeddings")
    print(f"Embedding shape: {embeddings_array.shape}, dtype: {embeddings_array.dtype}")
    
    # Save embeddings
    np.save('data/embeddings/text_embeddings.npy', embeddings_array)
    np.save('data/embeddings/text_product_ids.npy', product_ids_array)
    
    # Clean up
    del model, processor
    torch.cuda.empty_cache() if torch.cuda.is_available() else None
    
    print(f"Saved CLIP text embeddings for {len(embeddings_array)} products")
    return embeddings_array, product_ids_array

def create_faiss_index(embeddings, index_path='data/embeddings/faiss_index.bin'):
    """
    Create an optimized FAISS index for efficient similarity search
    """
    print("Creating FAISS index...")
    
    if embeddings is None or len(embeddings) == 0:
        print("No embeddings provided!")
        return None
    
    # Get embedding dimension
    d = embeddings.shape[1]
    print(f"Embedding dimension: {d}")
    print(f"Number of vectors: {len(embeddings)}")
    
    # Ensure embeddings are float32 and normalized
    embeddings = embeddings.astype(np.float32)
    
    # Re-normalize to be safe
    for i in range(len(embeddings)):
        norm = np.linalg.norm(embeddings[i])
        if norm > 0:
            embeddings[i] = embeddings[i] / norm
    
    print(f"Processed embeddings shape: {embeddings.shape}, dtype: {embeddings.dtype}")
    
    # Choose index type based on dataset size
    if len(embeddings) < 1000:
        print("Using IndexFlatIP for small dataset (cosine similarity)")
        index = faiss.IndexFlatIP(d)
    elif len(embeddings) < 10000:
        print("Using IndexHNSWFlat for medium dataset")
        # HNSW is good for medium-sized datasets
        index = faiss.IndexHNSWFlat(d, 32, faiss.METRIC_INNER_PRODUCT)
        index.hnsw.efConstruction = 200
        index.hnsw.efSearch = 50
    else:
        print("Using IndexIVFFlat for large dataset")
        # IVF for large datasets
        nlist = min(4096, max(int(np.sqrt(len(embeddings))), 100))
        print(f"Using {nlist} clusters for IVF index")
        quantizer = faiss.IndexFlatIP(d)
        index = faiss.IndexIVFFlat(quantizer, d, nlist, faiss.METRIC_INNER_PRODUCT)
        
        # Train the index
        print("Training IVF index...")
        index.train(embeddings)
        print("IVF index trained successfully")
    
    # Add embeddings to index
    print(f"Adding {len(embeddings)} vectors to index...")
    try:
        index.add(embeddings)
        print(f"Added {index.ntotal} vectors to index")
    except Exception as e:
        print(f"Error adding vectors to index: {e}")
        return None
    
    # Save index
    try:
        print(f"Saving index to {index_path}...")
        faiss.write_index(index, index_path)
        print(f"FAISS index saved successfully")
    except Exception as e:
        print(f"Error saving index: {e}")
        return None
    
    # Test the index
    print("Testing index with a random query...")
    try:
        test_query = np.random.random(d).astype(np.float32)
        test_query = test_query / np.linalg.norm(test_query)
        test_query = test_query.reshape(1, -1)
        
        # Set nprobe for IVF indexes
        if hasattr(index, 'nprobe'):
            index.nprobe = 10
        
        distances, indices = index.search(test_query, min(5, len(embeddings)))
        print(f"Test search successful - distances: {distances[0][:3]}, indices: {indices[0][:3]}")
    except Exception as e:
        print(f"Error testing index: {e}")
    
    return index

# Legacy function for backward compatibility
def generate_image_embeddings(products_df, batch_size=8):
    """Legacy wrapper - now uses CLIP instead of MobileNet"""
    print("Note: Using CLIP embeddings instead of MobileNet for consistency")
    return generate_image_embeddings_clip(products_df, batch_size)

def generate_text_embeddings(products_df, batch_size=16, model_name='clip'):
    """Legacy wrapper - now uses CLIP instead of sentence transformers"""
    print("Note: Using CLIP embeddings instead of sentence transformers for consistency")
    return generate_text_embeddings_clip(products_df, batch_size)