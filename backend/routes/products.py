from flask import Blueprint, request, jsonify
from database.models import db, Product
from sqlalchemy import desc, func, or_
import traceback

products_bp = Blueprint('products', __name__)

@products_bp.route('/search', methods=['GET'])
def search_products():
    """
    Search products by name, description, or category
    """
    try:
        query = request.args.get('q', '').strip()
        limit = request.args.get('limit', 20, type=int)
        category = request.args.get('category', None)
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        
        print(f"Searching for: '{query}' with limit: {limit}")
        
        # Build search query
        search_query = Product.query
        
        # Filter by category if provided
        if category:
            search_query = search_query.filter(Product.category.ilike(f'%{category}%'))
        
        # Filter by price range
        if min_price is not None:
            search_query = search_query.filter(Product.price >= min_price)
        if max_price is not None:
            search_query = search_query.filter(Product.price <= max_price)
        
        # Search in name, description, and category
        search_terms = query.split()
        
        for term in search_terms:
            search_filter = or_(
                Product.name.ilike(f'%{term}%'),
                Product.description.ilike(f'%{term}%'),
                Product.category.ilike(f'%{term}%')
            )
            search_query = search_query.filter(search_filter)
        
        # Execute query and get results
        products = search_query.limit(limit).all()
        
        print(f"Found {len(products)} products")
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'total': len(products),
            'query': query,
            'limit': limit,
            'category': category
        })
        
    except Exception as e:
        print(f"Error in search_products: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to search products', 'details': str(e)}), 500

@products_bp.route('/latest', methods=['GET'])
def get_latest_products():
    """
    Get latest products ordered by ID (most recently added)
    """
    try:
        limit = request.args.get('limit', 12, type=int)
        category = request.args.get('category', None)
        
        # Build query
        query = Product.query
        
        # Filter by category if provided
        if category:
            query = query.filter(Product.category.ilike(f'%{category}%'))
        
        # Order by ID descending (latest first) and apply limit
        products = query.order_by(desc(Product.id)).limit(limit).all()
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'total': len(products),
            'limit': limit,
            'category': category
        })
        
    except Exception as e:
        print(f"Error in get_latest_products: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch latest products', 'details': str(e)}), 500

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """
    Get all unique product categories
    """
    try:
        categories = db.session.query(Product.category).distinct().all()
        category_list = [category[0] for category in categories if category[0]]
        
        return jsonify({
            'categories': sorted(category_list),
            'total': len(category_list)
        })
        
    except Exception as e:
        print(f"Error in get_categories: {e}")
        return jsonify({'error': 'Failed to fetch categories', 'details': str(e)}), 500

@products_bp.route('/trending', methods=['GET'])
def get_trending_products():
    """
    Get trending products based on user interactions
    """
    try:
        from database.models import UserHistory
        
        limit = request.args.get('limit', 12, type=int)
        
        # Get products with most interactions
        trending_query = db.session.query(
            Product,
            func.count(UserHistory.id).label('interaction_count')
        ).join(
            UserHistory, Product.id == UserHistory.product_id
        ).group_by(
            Product.id
        ).order_by(
            desc('interaction_count')
        ).limit(limit)
        
        results = trending_query.all()
        
        trending_products = []
        for product, count in results:
            product_dict = product.to_dict()
            product_dict['interaction_count'] = count
            trending_products.append(product_dict)
        
        # If not enough trending products, fill with latest products
        if len(trending_products) < limit:
            remaining_limit = limit - len(trending_products)
            trending_ids = [p['id'] for p in trending_products]
            
            latest_products = Product.query.filter(
                ~Product.id.in_(trending_ids)
            ).order_by(desc(Product.id)).limit(remaining_limit).all()
            
            for product in latest_products:
                product_dict = product.to_dict()
                product_dict['interaction_count'] = 0
                trending_products.append(product_dict)
        
        return jsonify({
            'products': trending_products,
            'total': len(trending_products),
            'limit': limit
        })
        
    except Exception as e:
        print(f"Error in get_trending_products: {e}")
        # Fallback to latest products if trending calculation fails
        try:
            products = Product.query.order_by(desc(Product.id)).limit(limit).all()
            return jsonify({
                'products': [product.to_dict() for product in products],
                'total': len(products),
                'limit': limit,
                'fallback': True
            })
        except Exception as fallback_error:
            return jsonify({'error': 'Failed to fetch trending products', 'details': str(e)}), 500
