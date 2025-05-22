import pandas as pd
import numpy as np
import os
import requests
import json
from tqdm import tqdm
from PIL import Image
from io import BytesIO
import time
from database.models import db, Product

def download_abo_metadata(limit=1000):
    """
    Download a subset of the Amazon Berkeley Objects dataset metadata
    """
    print("Downloading ABO dataset metadata...")
    
    # Create directories for data storage
    os.makedirs('data/raw', exist_ok=True)
    
    # The dataset is quite large, so we'll download a sample
    url = "https://amazon-berkeley-objects.s3.amazonaws.com/metadata/metadata.json"
    
    # For demo purposes, we'll download only the first part
    response = requests.get(url, stream=True)
    
    if response.status_code == 200:
        products = []
        count = 0
        
        # Parse the JSON line by line to avoid loading the entire file
        for line in response.iter_lines():
            if line:
                try:
                    product = json.loads(line)
                    products.append(product)
                    count += 1
                    if count >= limit:
                        break
                except json.JSONDecodeError:
                    continue
        
        # Convert to DataFrame
        df = pd.DataFrame(products)
        
        # Save to CSV
        df.to_csv('data/raw/abo_products.csv', index=False)
        print(f"Downloaded {len(df)} product metadata records")
        return df
    else:
        print(f"Failed to download dataset: {response.status_code}")
        return None

def download_product_images(products_df, limit=100):
    """
    Download product images from the ABO dataset
    """
    print(f"Downloading {limit} product images...")
    
    os.makedirs('data/images', exist_ok=True)
    
    # Filter products with image URLs
    if 'image' in products_df.columns:
        products_with_images = products_df[products_df['image'].notna()].head(limit)
    elif 'url' in products_df.columns:
        products_with_images = products_df[products_df['url'].notna()].head(limit)
    else:
        # Use catalog_image_url if available
        image_col = [col for col in products_df.columns if 'image' in col.lower()]
        if image_col:
            products_with_images = products_df[products_df[image_col[0]].notna()].head(limit)
        else:
            print("No image URLs found in the dataset")
            return products_df
    
    # Download images
    downloaded_count = 0
    for idx, row in tqdm(products_with_images.iterrows(), total=len(products_with_images)):
        try:
            # Get image URL
            if 'image' in products_df.columns:
                img_url = row['image']
            elif 'url' in products_df.columns:
                img_url = row['url']
            else:
                img_url = row[image_col[0]]
            
            # Skip if URL is not valid
            if not isinstance(img_url, str) or not img_url.startswith('http'):
                continue
                
            # Download image
            response = requests.get(img_url, timeout=5)
            
            if response.status_code == 200:
                img = Image.open(BytesIO(response.content))
                img_path = f'data/images/{row.name}.jpg'
                img.save(img_path)
                downloaded_count += 1
                
                # Add image path to DataFrame
                products_df.at[idx, 'local_image_path'] = img_path
            
            # Be nice to the server
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Error downloading image for product {row.name}: {e}")
    
    print(f"Successfully downloaded {downloaded_count} images")
    return products_df

def load_products_to_db(products_df):
    """
    Load products from DataFrame to database
    """
    print("Loading products to database...")
    
    try:
        # Clear existing products
        Product.query.delete()
        
        # Insert new products
        for idx, row in products_df.iterrows():
            product = Product(
                name=row.get('product_name', row.get('name', '')),
                description=row.get('about_product', row.get('description', '')),
                category=row.get('category', ''),
                price=float(row.get('selling_price', row.get('price', 0))),
                image_url=row.get('image', row.get('url', '')),
                features=json.dumps({
                    "main_category": row.get('category', ''),
                    "subcategory": row.get('subcategory', ''),
                    "colors": [],
                    "patterns": [],
                    "style": [],
                    "material": row.get('material', ''),
                    "brand": row.get('brand', '')
                })
            )
            db.session.add(product)
        
        db.session.commit()
        print(f"Loaded {len(products_df)} products to database")
        
    except Exception as e:
        print(f"Error loading products to database: {e}")
        db.session.rollback()
