#!/usr/bin/env python3
"""
Script to rebuild FAISS indices with consistent CLIP embeddings
Run this script to fix the dimension mismatch issue
"""

import pandas as pd
import numpy as np
import os
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def main():
    """Main function to rebuild indices"""
    print("=== FAISS Index Rebuilding Script ===")
    print("This script will rebuild your FAISS indices with consistent CLIP embeddings (512 dimensions)")
    print()
    
    # Check if required directories exist
    embeddings_dir = Path('data/embeddings')
    if not embeddings_dir.exists():
        print("Creating embeddings directory...")
        embeddings_dir.mkdir(parents=True, exist_ok=True)
    
    # Load your products data
    # You'll need to modify this path to match your actual data file
    data_files = [
        'data/processed/fashion_products_processed.csv',
        'data/raw/fashion_products.csv',
        'data/products.csv',
        'data/amazon_products.csv',
        'products.csv',
        'amazon.csv'
    ]
    
    products_df = None
    for data_file in data_files:
        if os.path.exists(data_file):
            print(f"Loading products data from {data_file}...")
            try:
                products_df = pd.read_csv(data_file)
                print(f"Loaded {len(products_df)} products")
                break
            except Exception as e:
                print(f"Error loading {data_file}: {e}")
                continue
    
    if products_df is None:
        print("ERROR: Could not find products data file!")
        print("Please ensure you have one of these files:")
        for f in data_files:
            print(f"  - {f}")
        print()
        print("Or modify this script to point to your actual data file.")
        return False
    
    # Check for required columns
    required_columns = ['local_image_path']  # Adjust based on your data
    missing_columns = [col for col in required_columns if col not in products_df.columns]
    
    if missing_columns:
        print(f"WARNING: Missing columns: {missing_columns}")
        print("Available columns:", list(products_df.columns))
        
        # Try to map common column names
        column_mapping = {
            'image_path': 'local_image_path',
            'image_url': 'local_image_path',
            'img_path': 'local_image_path',
            'image_file': 'local_image_path'
        }
        
        for old_name, new_name in column_mapping.items():
            if old_name in products_df.columns and new_name in missing_columns:
                products_df[new_name] = products_df[old_name]
                print(f"Mapped {old_name} -> {new_name}")
    
    # Import the updated services
    try:
        from services.embedding_service import generate_image_embeddings_clip, generate_text_embeddings_clip, create_faiss_index
        print("Successfully imported embedding services")
    except ImportError as e:
        print(f"Error importing services: {e}")
        print("Make sure you're running this script from the project root directory")
        return False
    
    # Generate image embeddings
    print("\n=== Generating Image Embeddings ===")
    try:
        # Filter products with images
        products_with_images = products_df[products_df['local_image_path'].notna()]
        print(f"Found {len(products_with_images)} products with images")
        
        if len(products_with_images) > 0:
            image_embeddings, image_product_ids = generate_image_embeddings_clip(
                products_with_images, 
                batch_size=4  # Smaller batch size for stability
            )
            
            if image_embeddings is not None and len(image_embeddings) > 0:
                print(f"Generated {len(image_embeddings)} image embeddings")
                
                # Create image FAISS index
                print("Creating image FAISS index...")
                image_index = create_faiss_index(
                    image_embeddings, 
                    'data/embeddings/faiss_index.bin'
                )
                
                if image_index:
                    print("✅ Image index created successfully!")
                else:
                    print("❌ Failed to create image index")
            else:
                print("❌ No image embeddings generated")
        else:
            print("⚠️  No products with images found")
    
    except Exception as e:
        print(f"❌ Error generating image embeddings: {e}")
        import traceback
        traceback.print_exc()
    
    # Generate text embeddings
    print("\n=== Generating Text Embeddings ===")
    try:
        text_embeddings, text_product_ids = generate_text_embeddings_clip(
            products_df,
            batch_size=8  # Smaller batch size for stability
        )
        
        if text_embeddings is not None and len(text_embeddings) > 0:
            print(f"Generated {len(text_embeddings)} text embeddings")
            
            # Create text FAISS index
            print("Creating text FAISS index...")
            text_index = create_faiss_index(
                text_embeddings,
                'data/embeddings/text_faiss_index.bin'
            )
            
            if text_index:
                print("✅ Text index created successfully!")
            else:
                print("❌ Failed to create text index")
        else:
            print("❌ No text embeddings generated")
    
    except Exception as e:
        print(f"❌ Error generating text embeddings: {e}")
        import traceback
        traceback.print_exc()
    
    # Verify the indices
    print("\n=== Verification ===")
    verify_indices()
    
    print("\n=== Rebuild Complete ===")
    print("Your FAISS indices have been rebuilt with consistent CLIP embeddings!")
    print("All embeddings now use 512 dimensions, which should resolve the mismatch error.")
    return True

def verify_indices():
    """Verify that indices were created correctly"""
    try:
        import faiss
        
        # Check image index
        if os.path.exists('data/embeddings/faiss_index.bin'):
            index = faiss.read_index('data/embeddings/faiss_index.bin')
            print(f"✅ Image index: {index.ntotal} vectors, {index.d} dimensions")
        else:
            print("❌ Image index not found")
        
        # Check text index
        if os.path.exists('data/embeddings/text_faiss_index.bin'):
            index = faiss.read_index('data/embeddings/text_faiss_index.bin')
            print(f"✅ Text index: {index.ntotal} vectors, {index.d} dimensions")
        else:
            print("❌ Text index not found")
        
        # Check embeddings
        if os.path.exists('data/embeddings/image_embeddings.npy'):
            embeddings = np.load('data/embeddings/image_embeddings.npy')
            print(f"✅ Image embeddings: {embeddings.shape}, dtype: {embeddings.dtype}")
        
        if os.path.exists('data/embeddings/text_embeddings.npy'):
            embeddings = np.load('data/embeddings/text_embeddings.npy')
            print(f"✅ Text embeddings: {embeddings.shape}, dtype: {embeddings.dtype}")
    
    except Exception as e:
        print(f"Error during verification: {e}")

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)