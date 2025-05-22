from database.models import db, Product, User, UserHistory
import pandas as pd
import json

def load_product_catalog(csv_path):
    """
    Load product catalog from CSV file
    
    Args:
        csv_path: Path to CSV file
    """
    try:
        df = pd.read_csv(csv_path)
        
        # Clear existing products
        Product.query.delete()
        
        # Insert new products
        for _, row in df.iterrows():
            product = Product(
                name=row['name'],
                description=row['description'],
                category=row['category'],
                price=float(row['price']),
                image_url=row['image_url'],
                features=json.dumps(row['features']) if 'features' in row else None
            )
            db.session.add(product)
        
        db.session.commit()
        print(f"Loaded {len(df)} products")
        
    except Exception as e:
        print(f"Error loading product catalog: {e}")
        db.session.rollback()

def get_user_recommendations(user_id, limit=10):
    """
    Get personalized recommendations for a user
    
    Args:
        user_id: User ID
        limit: Maximum number of recommendations
        
    Returns:
        List of product dictionaries
    """
    user = User.query.get(user_id)
    
    if not user:
        return []
    
    # Get user's interaction history
    history = UserHistory.query.filter_by(user_id=user_id).all()
    
    # Extract viewed and purchased product IDs
    viewed_products = [h.product_id for h in history if h.interaction_type == 'view']
    purchased_products = [h.product_id for h in history if h.interaction_type == 'purchase']
    
    # Get user preferences
    preferences = user.preferences or {}
    
    # Find products matching user preferences
    query = Product.query
    
    if preferences.get('categories'):
        query = query.filter(Product.category.in_(preferences['categories']))
    
    if preferences.get('price_range'):
        min_price = preferences['price_range'].get('min', 0)
        max_price = preferences['price_range'].get('max', float('inf'))
        query = query.filter(Product.price >= min_price, Product.price <= max_price)
    
    # Exclude already purchased products
    if purchased_products:
        query = query.filter(~Product.id.in_(purchased_products))
    
    # Get recommended products
    recommended_products = query.limit(limit).all()
    
    return [product.to_dict() for product in recommended_products]
