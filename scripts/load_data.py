import os
import sys
import pandas as pd
import json
import random
import requests
from tqdm import tqdm
from PIL import Image
from io import BytesIO
import time
from faker import Faker

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from database.models import db, Product
from services.embedding_service import generate_image_embeddings, generate_text_embeddings, create_faiss_index

fake = Faker()

def download_abo_metadata(limit=1000):
    """
    Download a subset of the Amazon Berkeley Objects dataset metadata
    
    Args:
        limit: Maximum number of products to download
    """
    print("Downloading ABO dataset metadata...")
    
    # Create directories for data storage
    os.makedirs('data/raw', exist_ok=True)
    
    # The dataset is quite large, so we'll download a sample
    url = "https://amazon-berkeley-objects.s3.amazonaws.com/metadata/metadata.json"
    
    try:
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
    except Exception as e:
        print(f"Error downloading ABO metadata: {e}")
        return None

def download_product_images(products_df, limit=100):
    """
    Download product images from the ABO dataset
    
    Args:
        products_df: DataFrame containing product metadata
        limit: Maximum number of images to download
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

def generate_sample_product_catalog(num_products=100, output_file='data/product_catalog.csv'):
    """
    Generate a sample product catalog
    
    Args:
        num_products: Number of products to generate
        output_file: Output CSV file path
    """
    print(f"Generating {num_products} sample products...")
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Define categories and subcategories
    categories = {
        'clothing': ['shirt', 'pants', 'dress', 'jacket', 'sweater'],
        'electronics': ['smartphone', 'laptop', 'headphones', 'tablet', 'smartwatch'],
        'home': ['sofa', 'chair', 'table', 'lamp', 'rug'],
        'beauty': ['makeup', 'skincare', 'fragrance', 'haircare', 'tools']
    }
    
    # Define colors
    colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'purple', 'pink', 'orange', 'gray']
    
    # Define patterns
    patterns = ['solid', 'striped', 'floral', 'checkered', 'polka dot', 'geometric', 'abstract']
    
    # Define materials
    materials = ['cotton', 'polyester', 'leather', 'wool', 'silk', 'metal', 'plastic', 'glass', 'wood', 'ceramic']
    
    # Define brands
    brands = ['BrandX', 'FashionY', 'TechZ', 'HomeStyle', 'BeautyGlow', 'LuxuryA', 'EcoB', 'SportC', 'ClassicD', 'ModernE']
    
    # Generate products
    products = []
    
    for i in range(num_products):
        # Select random category and subcategory
        category = random.choice(list(categories.keys()))
        subcategory = random.choice(categories[category])
        
        # Generate random features
        product_colors = random.sample(colors, random.randint(1, 3))
        product_pattern = random.choice(patterns) if random.random() > 0.5 else None
        product_material = random.choice(materials)
        product_brand = random.choice(brands)
        
        # Generate price
        price = round(random.uniform(10, 1000), 2)
        
        # Generate name
        name = f"{product_brand} {subcategory.title()}"
        if product_pattern:
            name = f"{product_brand} {product_pattern.title()} {subcategory.title()}"
        
        # Generate description
        description = fake.paragraph(nb_sentences=3)
        
        # Generate image URL (placeholder)
        image_url = f"https://picsum.photos/seed/{i}/400/400"
        
        # Generate features
        features = {
            "main_category": category,
            "subcategory": subcategory,
            "colors": product_colors,
            "patterns": [product_pattern] if product_pattern else [],
            "style": ["casual" if random.random() > 0.5 else "formal"],
            "material": product_material,
            "brand": product_brand
        }
        
        products.append({
            "name": name,
            "description": description,
            "category": category,
            "price": price,
            "image_url": image_url,
            "features": json.dumps(features)
        })
    
    # Create DataFrame and save to CSV
    df = pd.DataFrame(products)
    df.to_csv(output_file, index=False)
    
    print(f"Generated {num_products} sample products and saved to {output_file}")
    return df

def load_products_to_db(products_df):
    """
    Load products from DataFrame to database
    
    Args:
        products_df: DataFrame containing product data
    """
    print("Loading products to database...")
    
    with app.app_context():
        try:
            # Clear existing products
            Product.query.delete()
            
            # Insert new products
            for idx, row in products_df.iterrows():
                # Extract features
                if 'features' in row and isinstance(row['features'], str):
                    features = row['features']
                else:
                    # Create features dictionary for real data
                    features = {
                        "main_category": row.get('category', ''),
                        "subcategory": row.get('subcategory', ''),
                        "colors": [],
                        "patterns": [],
                        "style": [],
                        "material": row.get('material', ''),
                        "brand": row.get('brand', '')
                    }
                    features = json.dumps(features)
                
                product = Product(
                    name=row['name'],
                    description=row['description'],
                    category=row['category'],
                    price=float(row['price']),
                    image_url=row['image_url'],
                    features=features
                )
                
                # Add local image path if available
                if 'local_image_path' in row and pd.notna(row['local_image_path']):
                    product.local_image_path = row['local_image_path']
                
                db.session.add(product)
            
            db.session.commit()
            print(f"Loaded {len(products_df)} products to database")
            
        except Exception as e:
            print(f"Error loading products to database: {e}")
            db.session.rollback()

def main():
    """
    Main function to load data and generate embeddings
    """
    # Try to download real data first
    real_data = download_abo_metadata(limit=500)
    
    if real_data is not None and not real_data.empty:
        print("Using real data from Amazon Berkeley Objects dataset")
        
        # Download product images
        real_data = download_product_images(real_data, limit=100)
        
        # Save processed data
        os.makedirs('data/processed', exist_ok=True)
        real_data.to_csv('data/processed/real_products.csv', index=False)
        
        # Load products to database
        load_products_to_db(real_data)
        
        # Generate embeddings if images were downloaded
        if 'local_image_path' in real_data.columns and real_data['local_image_path'].notna().any():
            # Generate image embeddings
            image_embeddings, product_ids = generate_image_embeddings(real_data)
            
            # Create FAISS index for image embeddings
            if len(image_embeddings) > 0:
                create_faiss_index(image_embeddings, 'data/embeddings/image_faiss_index.bin')
            
            # Generate text embeddings
            text_embeddings, text_product_ids = generate_text_embeddings(real_data)
            
            # Create FAISS index for text embeddings
            if len(text_embeddings) > 0:
                create_faiss_index(text_embeddings, 'data/embeddings/text_faiss_index.bin')
        
        print("Real data loading and embedding generation complete!")
    else:
        print("Failed to download real data. Falling back to sample data generation.")
        
        # Generate sample product catalog
        sample_data = generate_sample_product_catalog(num_products=200)
        
        # Load products to database
        load_products_to_db(sample_data)
        
        print("Sample data generation and loading complete!")

if __name__ == '__main__':
    # Try to run with real data first, fall back to sample data if needed
    main()
