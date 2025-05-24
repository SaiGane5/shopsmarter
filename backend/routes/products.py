from flask import Blueprint, request, jsonify
from database.models import db, Product
from sqlalchemy import desc, func
import traceback

products_bp = Blueprint('products', __name__)

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

@products_bp.route('/search', methods=['GET'])
def search_products():
    """
    Search products by name, description, or category
    """
    try:
        query = request.args.get('q', '').strip()
        limit = request.args.get('limit', 20, type=int)
        category = request.args.get('category', None)
        
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        
        # Build search query
        search_query = Product.query
        
        # Filter by category if provided
        if category:
            search_query = search_query.filter(Product.category.ilike(f'%{category}%'))
        
        # Search in name, description, and category
        search_filter = db.or_(
            Product.name.ilike(f'%{query}%'),
            Product.description.ilike(f'%{query}%'),
            Product.category.ilike(f'%{query}%')
        )
        
        products = search_query.filter(search_filter).limit(limit).all()
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'total': len(products),
            'query': query,
            'limit': limit,
            'category': category
        })
        
    except Exception as e:
        print(f"Error in search_products: {e}")
        return jsonify({'error': 'Failed to search products', 'details': str(e)}), 500

@products_bp.route('/trending', methods=['GET'])
def get_trending_products():
    """
    Get trending products based on user interactions
    """
    try:
        from database.models import UserHistory
        
        limit = request.args.get('limit', 12, type=int)
        
        # Get products with most interactions in the last 30 days
        trending_query = db.session.query(
            Product,
            func.count(UserHistory.id).label('interaction_count')
        ).join(
            UserHistory, Product.id == UserHistory.product_id
        ).filter(
            UserHistory.timestamp >= func.datetime('now', '-30 days')
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

@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product_by_id(product_id):
    """
    Get a specific product by ID
    """
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({
            'product': product.to_dict()
        })
        
    except Exception as e:
        print(f"Error in get_product_by_id: {e}")
        return jsonify({'error': 'Failed to fetch product', 'details': str(e)}), 500

@products_bp.route('/stats', methods=['GET'])
def get_product_stats():
    """
    Get general product statistics
    """
    try:
        total_products = Product.query.count()
        categories = db.session.query(Product.category).distinct().count()
        
        # Get price range
        price_stats = db.session.query(
            func.min(Product.price).label('min_price'),
            func.max(Product.price).label('max_price'),
            func.avg(Product.price).label('avg_price')
        ).first()
        
        return jsonify({
            'total_products': total_products,
            'total_categories': categories,
            'price_range': {
                'min': float(price_stats.min_price) if price_stats.min_price else 0,
                'max': float(price_stats.max_price) if price_stats.max_price else 0,
                'average': round(float(price_stats.avg_price), 2) if price_stats.avg_price else 0
            }
        })
        
    except Exception as e:
        print(f"Error in get_product_stats: {e}")
        return jsonify({'error': 'Failed to fetch product statistics', 'details': str(e)}), 500
