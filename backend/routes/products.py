from flask import Blueprint, request, jsonify
from database.models import db, Product
from sqlalchemy import desc, func, or_, and_
import traceback

products_bp = Blueprint('products', __name__)

@products_bp.route('/search', methods=['GET'])
def search_products():
    """Enhanced search with better filtering and relevance"""
    try:
        query = request.args.get('q', '').strip()
        limit = request.args.get('limit', 20, type=int)
        category = request.args.get('category', None)
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        
        print(f"Enhanced search for: '{query}' with limit: {limit}")
        
        # Build base query
        search_query = Product.query
        
        # Apply price filters first (most restrictive)
        if min_price is not None:
            search_query = search_query.filter(Product.price >= min_price)
            print(f"Applied min_price filter: >= ${min_price}")
        
        if max_price is not None:
            search_query = search_query.filter(Product.price <= max_price)
            print(f"Applied max_price filter: <= ${max_price}")
        
        # Apply category filter
        if category:
            search_query = search_query.filter(Product.category.ilike(f'%{category}%'))
            print(f"Applied category filter: {category}")
        
        # Enhanced text search with relevance scoring
        search_terms = [term.strip() for term in query.split() if term.strip()]
        
        if search_terms:
            # Create search conditions for each term
            search_conditions = []
            
            for term in search_terms:
                term_conditions = or_(
                    Product.name.ilike(f'%{term}%'),
                    Product.description.ilike(f'%{term}%'),
                    Product.category.ilike(f'%{term}%')
                )
                search_conditions.append(term_conditions)
            
            # Combine all conditions (all terms must match)
            if search_conditions:
                search_query = search_query.filter(and_(*search_conditions))
        
        # Execute query with proper ordering
        products = search_query.order_by(
            # Prioritize exact name matches
            func.case(
                (Product.name.ilike(f'%{query}%'), 1),
                else_=2
            ),
            # Then by price (lower first)
            Product.price.asc(),
            # Finally by ID (newer first)
            Product.id.desc()
        ).limit(limit).all()
        
        print(f"Found {len(products)} products matching search criteria")
        
        # Convert to dict and add search relevance info
        result_products = []
        for product in products:
            product_dict = product.to_dict()
            
            # Add relevance scoring for debugging
            name_match = query.lower() in product_dict.get('name', '').lower()
            category_match = category and category.lower() in product_dict.get('category', '').lower()
            
            product_dict['relevance_info'] = {
                'name_match': name_match,
                'category_match': category_match,
                'price_in_range': True  # Already filtered
            }
            
            result_products.append(product_dict)
        
        return jsonify({
            'products': result_products,
            'total': len(result_products),
            'query': query,
            'limit': limit,
            'filters': {
                'category': category,
                'min_price': min_price,
                'max_price': max_price
            }
        })
        
    except Exception as e:
        print(f"Error in enhanced search: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to search products', 'details': str(e)}), 500

@products_bp.route('/filter', methods=['GET'])
def filter_products():
    """Advanced product filtering endpoint"""
    try:
        # Get filter parameters
        category = request.args.get('category', None)
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        color = request.args.get('color', None)
        style = request.args.get('style', None)
        brand = request.args.get('brand', None)
        limit = request.args.get('limit', 20, type=int)
        
        print(f"Filtering products with: category={category}, price=${min_price}-${max_price}, color={color}")
        
        # Build query with filters
        query = Product.query
        
        # Apply filters
        if category:
            query = query.filter(Product.category.ilike(f'%{category}%'))
        
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        
        if color:
            query = query.filter(or_(
                Product.name.ilike(f'%{color}%'),
                Product.description.ilike(f'%{color}%')
            ))
        
        if style:
            query = query.filter(or_(
                Product.name.ilike(f'%{style}%'),
                Product.description.ilike(f'%{style}%')
            ))
        
        if brand:
            query = query.filter(Product.name.ilike(f'%{brand}%'))
        
        # Execute query
        products = query.order_by(Product.price.asc()).limit(limit).all()
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'total': len(products),
            'filters_applied': {
                'category': category,
                'min_price': min_price,
                'max_price': max_price,
                'color': color,
                'style': style,
                'brand': brand
            }
        })
        
    except Exception as e:
        print(f"Error in filter_products: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to filter products', 'details': str(e)}), 500

@products_bp.route('/latest', methods=['GET'])
def get_latest_products():
    """Get latest products with optional filtering"""
    try:
        limit = request.args.get('limit', 12, type=int)
        category = request.args.get('category', None)
        max_price = request.args.get('max_price', type=float)
        
        # Build query
        query = Product.query
        
        # Apply filters
        if category:
            query = query.filter(Product.category.ilike(f'%{category}%'))
        
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        
        # Order by ID descending (latest first) and apply limit
        products = query.order_by(desc(Product.id)).limit(limit).all()
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'total': len(products),
            'limit': limit,
            'category': category,
            'max_price': max_price
        })
        
    except Exception as e:
        print(f"Error in get_latest_products: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch latest products', 'details': str(e)}), 500

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all unique product categories with counts"""
    try:
        # Get categories with product counts
        categories_with_counts = db.session.query(
            Product.category,
            func.count(Product.id).label('count')
        ).group_by(Product.category).all()
        
        category_list = []
        for category, count in categories_with_counts:
            if category:  # Exclude None/empty categories
                category_list.append({
                    'name': category,
                    'count': count
                })
        
        # Sort by count (most popular first)
        category_list.sort(key=lambda x: x['count'], reverse=True)
        
        return jsonify({
            'categories': category_list,
            'total': len(category_list)
        })
        
    except Exception as e:
        print(f"Error in get_categories: {e}")
        return jsonify({'error': 'Failed to fetch categories', 'details': str(e)}), 500

@products_bp.route('/trending', methods=['GET'])
def get_trending_products():
    """Get trending products with better fallback logic"""
    try:
        from database.models import UserHistory
        
        limit = request.args.get('limit', 12, type=int)
        category = request.args.get('category', None)
        max_price = request.args.get('max_price', type=float)
        
        # Build base query for trending
        trending_query = db.session.query(
            Product,
            func.count(UserHistory.id).label('interaction_count')
        ).join(
            UserHistory, Product.id == UserHistory.product_id, isouter=True
        ).group_by(Product.id)
        
        # Apply filters
        if category:
            trending_query = trending_query.filter(Product.category.ilike(f'%{category}%'))
        
        if max_price is not None:
            trending_query = trending_query.filter(Product.price <= max_price)
        
        # Get trending products
        results = trending_query.order_by(desc('interaction_count')).limit(limit).all()
        
        trending_products = []
        for product, count in results:
            product_dict = product.to_dict()
            product_dict['interaction_count'] = count or 0
            trending_products.append(product_dict)
        
        # If not enough trending products, fill with latest products
        if len(trending_products) < limit:
            remaining_limit = limit - len(trending_products)
            trending_ids = [p['id'] for p in trending_products]
            
            latest_query = Product.query.filter(~Product.id.in_(trending_ids) if trending_ids else True)
            
            # Apply same filters to latest products
            if category:
                latest_query = latest_query.filter(Product.category.ilike(f'%{category}%'))
            
            if max_price is not None:
                latest_query = latest_query.filter(Product.price <= max_price)
            
            latest_products = latest_query.order_by(desc(Product.id)).limit(remaining_limit).all()
            
            for product in latest_products:
                product_dict = product.to_dict()
                product_dict['interaction_count'] = 0
                trending_products.append(product_dict)
        
        return jsonify({
            'products': trending_products,
            'total': len(trending_products),
            'limit': limit,
            'category': category,
            'max_price': max_price
        })
        
    except Exception as e:
        print(f"Error in get_trending_products: {e}")
        # Enhanced fallback
        try:
            fallback_query = Product.query
            
            # Apply filters to fallback
            if category:
                fallback_query = fallback_query.filter(Product.category.ilike(f'%{category}%'))
            
            if max_price is not None:
                fallback_query = fallback_query.filter(Product.price <= max_price)
            
            products = fallback_query.order_by(desc(Product.id)).limit(limit).all()
            
            return jsonify({
                'products': [product.to_dict() for product in products],
                'total': len(products),
                'limit': limit,
                'fallback': True,
                'category': category,
                'max_price': max_price
            })
        except Exception as fallback_error:
            return jsonify({'error': 'Failed to fetch trending products', 'details': str(e)}), 500
