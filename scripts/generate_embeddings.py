import os
import sys
import sqlite3
import numpy as np
import pandas as pd
from tqdm import tqdm
import torch
import clip
from PIL import Image
from init_db import init_db
# Add the parent directory to the path so we can import from services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.clip_model import extract_image_features, extract_text_features

# Database file
DB_FILE = 'data/shopsmarter.db'

def load_product_data(csv_file):
    """
    Load product data from a CSV file.
    
    Args:
        csv_file (str): Path to the CSV file.
        
    Returns:
        pandas.DataFrame: The product data.
    """
    try:
        df = pd.read_csv(csv_file)
        print(f"Loaded {len(df)} products from {csv_file}")
        return df
    except Exception as e:
        print(f"Error loading product data: {str(e)}")
        return None

def insert_products(products_df):
    """
    Insert products into the database.
    
    Args:
        products_df (pandas.DataFrame): The product data.
        
    Returns:
        int: The number of products inserted.
    """
    # Make sure the database and tables exist
    init_db()  # Import and call your init_db function
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    count = 0
    
    for _, row in tqdm(products_df.iterrows(), total=len(products_df), desc="Inserting products"):
        try:
            # Extract the product data
            product_id = str(row['id'])
            name = row['name']
            description = row.get('description', '')
            brand = row.get('brand', '')
            category = row.get('category', '')
            price = float(row['price'])
            image_url = row['image_url']
            
            # Check if the product already exists
            cursor.execute('SELECT id FROM products WHERE id = ?', (product_id,))
            if cursor.fetchone():
                continue
            
            # Generate embeddings
            text_embedding = None
            
            try:
                # Combine name, description, and category for better text embedding
                text = f"{name} {description} {category}"
                text_embedding = extract_text_features(text)
            except Exception as e:
                print(f"Error generating text embedding for product {product_id}: {str(e)}")
            
            # Insert the product
            if text_embedding is not None:
                cursor.execute(
                    'INSERT INTO products (id, name, description, brand, category, price, image_url, embedding) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    (product_id, name, description, brand, category, price, image_url, text_embedding.tobytes())
                )
                count += 1
        
        except Exception as e:
            print(f"Error inserting product: {str(e)}")
    
    conn.commit()
    conn.close()
    
    return count

def main():
    # Check if the data directory exists
    if not os.path.exists('data'):
        os.makedirs('data')
    
    # Load product data
    products_df = load_product_data('data/product_catalog.csv')
    
    if products_df is None:
        print("Failed to load product data. Exiting.")
        return
    
    # Insert products into the database
    count = insert_products(products_df)
    
    print(f"Inserted {count} products into the database.")

if __name__ == '__main__':
    main()
