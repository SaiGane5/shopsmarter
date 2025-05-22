import os
import sys
import pandas as pd
import json
import requests
from tqdm import tqdm
from PIL import Image
from io import BytesIO
import time
from datasets import load_dataset
import gc
import numpy as np

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from database.models import db, Product

def download_fashion_dataset():
    """
    Download the fashion-product-images-small dataset from Hugging Face
    """
    print("Downloading fashion-product-images-small dataset...")
    
    try:
        # Load dataset from Hugging Face
        dataset = load_dataset("ashraq/fashion-product-images-small")
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(dataset['train'])
        
        # Save to CSV
        os.makedirs('data/raw', exist_ok=True)
        df.to_csv('data/raw/fashion_products.csv', index=False)
        
        print(f"Downloaded {len(df)} fashion products")
        return df
    except Exception as e:
        print(f"Error downloading fashion dataset: {e}")
        return None

def process_fashion_dataset(df):
    """
    Process fashion dataset and prepare for database
    """
    print("Processing fashion dataset...")
    
    # Create directories for images - make sure this is in the public/static directory
    # that your web server can access
    os.makedirs('static/images', exist_ok=True)
    
    # Process each product
    processed_data = []
    for idx, row in tqdm(df.iterrows(), total=len(df), desc="Processing products"):
        try:
            # Extract image and save locally
            if 'image' in row and row['image'] is not None:
                img = row['image']
                img_path = f'static/images/fashion_{row["id"]}.jpg'
                
                # Convert and resize image to reduce memory usage
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize large images to save space and memory
                if img.size[0] > 800 or img.size[1] > 800:
                    img.thumbnail((800, 800), Image.Resampling.LANCZOS)
                
                img.save(img_path, 'JPEG', quality=85, optimize=True)
                
                # Use a web-accessible path for the image_url
                image_url = f"/static/images/fashion_{row['id']}.jpg"
                
                # Create product entry
                product = {
                    'name': row['productDisplayName'],
                    'description': f"{row['gender']} {row['articleType']} in {row['baseColour']} for {row['usage']}",
                    'category': row['masterCategory'],
                    'subcategory': row['subCategory'],
                    'price': float(50 + (row['id'] % 100)),  # Generate a fake price
                    'image_url': image_url,  # Use web-accessible path
                    'local_image_path': img_path,
                    'features': json.dumps({
                        'main_category': str(row['masterCategory']).lower(),
                        'subcategory': str(row['subCategory']).lower(),
                        'colors': [str(row['baseColour']).lower()],
                        'patterns': [],
                        'style': [str(row['usage']).lower()],
                        'material': '',
                        'brand': '',
                        'gender': str(row['gender']).lower(),
                        'article_type': str(row['articleType']).lower(),
                        'season': str(row['season']).lower(),
                        'year': int(row['year']) if not pd.isna(row['year']) else 2020
                    })
                }
                
                processed_data.append(product)
                
                # Process only a subset to keep it manageable for testing
                if len(processed_data) >= 500:  # Reduced from 1000 to 500
                    print(f"Processed {len(processed_data)} products (limiting for stability)")
                    break
                    
        except Exception as e:
            print(f"Error processing product {idx}: {e}")
            continue
    
    # Convert to DataFrame
    processed_df = pd.DataFrame(processed_data)
    
    # Save processed data
    os.makedirs('data/processed', exist_ok=True)
    processed_df.to_csv('data/processed/fashion_products_processed.csv', index=False)
    
    print(f"Processed {len(processed_df)} fashion products")
    return processed_df

def load_products_to_database(processed_df):
    """
    Load products to database safely
    """
    print("Loading products to database...")
    
    try:
        # Clear existing products
        Product.query.delete()
        db.session.commit()
        print("Cleared existing products")
        
        # Insert new products in batches
        batch_size = 50
        for i in range(0, len(processed_df), batch_size):
            batch = processed_df.iloc[i:i+batch_size]
            
            for _, row in batch.iterrows():
                product = Product(
                    name=row['name'],
                    description=row['description'],
                    category=row['category'],
                    price=row['price'],
                    image_url=row['image_url'],
                    features=row['features']
                )
                
                # Add local image path if available
                if 'local_image_path' in row and pd.notna(row['local_image_path']):
                    product.local_image_path = row['local_image_path']
                
                db.session.add(product)
            
            # Commit each batch
            db.session.commit()
            print(f"Loaded batch {i//batch_size + 1}/{(len(processed_df)-1)//batch_size + 1}")
        
        print(f"Successfully loaded {len(processed_df)} products to database")
        return True
        
    except Exception as e:
        print(f"Error loading products to database: {e}")
        db.session.rollback()
        return False

def generate_embeddings_safely(processed_df):
    """
    Generate embeddings with better memory management and error handling
    """
    print("Generating embeddings...")
    
    try:
        # Import the updated embedding service
        from services.embedding_service import generate_image_embeddings_clip, create_faiss_index
        
        # Generate image embeddings with very small batch size to avoid memory issues
        print("Generating CLIP image embeddings...")
        image_embeddings, product_ids = generate_image_embeddings_clip(
            processed_df, 
            batch_size=4  # Very small batch size to prevent segmentation fault
        )
        
        # Force garbage collection
        gc.collect()
        
        if image_embeddings is not None and len(image_embeddings) > 0:
            print(f"Generated {len(image_embeddings)} image embeddings")
            
            # Create FAISS index with safer parameters
            print("Creating FAISS index...")
            try:
                # Use the most basic FAISS index to avoid segmentation faults
                import faiss
                
                # Create a simple flat index (most stable)
                d = image_embeddings.shape[1]  # Should be 512 for CLIP
                print(f"Creating index with dimension {d}")
                
                # Ensure embeddings are properly formatted
                embeddings = image_embeddings.astype(np.float32)
                
                # Normalize embeddings
                for i in range(len(embeddings)):
                    norm = np.linalg.norm(embeddings[i])
                    if norm > 0:
                        embeddings[i] = embeddings[i] / norm
                
                # Create simple flat index (most stable)
                index = faiss.IndexFlatIP(d)
                
                print(f"Adding {len(embeddings)} vectors to index...")
                index.add(embeddings)
                
                # Save index
                index_path = 'data/embeddings/faiss_index.bin'
                os.makedirs('data/embeddings', exist_ok=True)
                faiss.write_index(index, index_path)
                
                print(f"✅ Successfully created FAISS index with {index.ntotal} vectors")
                
                # Test the index
                test_query = np.random.random(d).astype(np.float32)
                test_query = test_query / np.linalg.norm(test_query)
                test_query = test_query.reshape(1, -1)
                
                distances, indices = index.search(test_query, 5)
                print(f"✅ Index test successful: {len(indices[0])} results found")
                
            except Exception as e:
                print(f"❌ Error creating FAISS index: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("❌ No image embeddings generated")
    
    except Exception as e:
        print(f"❌ Error in embedding generation: {e}")
        import traceback
        traceback.print_exc()

def main():
    """
    Main function to load data and generate embeddings
    """
    print("=== Fashion Product Data Loading Script ===")
    
    # Check if processed data already exists
    processed_file = 'data/processed/fashion_products_processed.csv'
    
    if os.path.exists(processed_file):
        print(f"Found existing processed data at {processed_file}")
        processed_df = pd.read_csv(processed_file)
        print(f"Loaded {len(processed_df)} products from existing file")
    else:
        # Download and process fashion dataset
        fashion_df = download_fashion_dataset()
        
        if fashion_df is not None:
            # Process fashion dataset
            processed_df = process_fashion_dataset(fashion_df)
        else:
            print("Failed to download fashion dataset.")
            return
    
    # Work with Flask app context
    with app.app_context():
        if processed_df is not None and not processed_df.empty:
            # Load products to database
            success = load_products_to_database(processed_df)
            
            if success:
                # Generate embeddings with better error handling
                generate_embeddings_safely(processed_df)
            else:
                print("Failed to load products to database, skipping embedding generation")
        else:
            print("No processed data available")

if __name__ == '__main__':
    # Set environment variables to potentially help with stability
    os.environ['OMP_NUM_THREADS'] = '1'
    os.environ['MKL_NUM_THREADS'] = '1'
    os.environ['NUMEXPR_NUM_THREADS'] = '1'
    
    main()