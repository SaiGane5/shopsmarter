from flask import Blueprint, request, jsonify
from database.models import db, Product
from sqlalchemy import desc, func, or_, and_, case, text
import traceback
import re

products_bp = Blueprint('products', __name__)

def clean_search_query(query):
    """Clean and preprocess search query from voice or text input"""
    if not query:
        return ""
    
    # Remove extra punctuation and normalize
    cleaned = re.sub(r'[^\w\s-]', '', query.strip())  # Remove punctuation except hyphens
    cleaned = re.sub(r'\s+', ' ', cleaned)  # Normalize whitespace
    cleaned = cleaned.lower().strip()
    
    # Handle common voice recognition issues
    voice_corrections = {
        'tshirts': 't-shirts',
        'tshirt': 't-shirt',
        'jense': 'jeans',
        'red tshirts': 'red t-shirts',
        'blue jense': 'blue jeans'
    }
    
    for incorrect, correct in voice_corrections.items():
        cleaned = cleaned.replace(incorrect, correct)
    
    print(f"Query cleaned: '{query}' -> '{cleaned}'")
    return cleaned

def detect_clothing_search(query):
    """Detect if the search query is for clothing items"""
    clothing_keywords = [
        'shirt', 't-shirt', 'tshirt', 'top', 'blouse', 'sweater', 'hoodie',
        'dress', 'skirt', 'pants', 'jeans', 'trousers', 'shorts',
        'jacket', 'coat', 'blazer', 'vest', 'cardigan',
        'underwear', 'bra', 'socks', 'clothing', 'apparel', 'fashion',
        'outfit', 'wear', 'garment'
    ]
    
    color_keywords = [
        'red', 'blue', 'green', 'yellow', 'black', 'white', 'pink',
        'purple', 'orange', 'brown', 'gray', 'grey', 'navy', 'maroon'
    ]
    
    query_lower = query.lower()
    
    # Check for clothing keywords
    has_clothing = any(keyword in query_lower for keyword in clothing_keywords)
    
    # Check for color + clothing combination
    has_color = any(color in query_lower for color in color_keywords)
    
    return has_clothing or (has_color and any(term in query_lower for term in ['shirt', 'dress', 'pants', 'top']))

def extract_search_components(query):
    """Extract colors, clothing types, and other components from search query"""
    colors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'pink', 'purple', 'orange', 'brown', 'gray', 'grey', 'navy', 'maroon', 'beige', 'cream']
    clothing_types = ['shirt', 't-shirt', 'tshirt', 'top', 'blouse', 'dress', 'pants', 'jeans', 'jacket', 'hoodie', 'sweater', 'shorts']
    
    query_lower = query.lower()
    
    found_colors = [color for color in colors if color in query_lower]
    found_clothing = [item for item in clothing_types if item in query_lower or item.replace('-', '') in query_lower]
    
    return {
        'colors': found_colors,
        'clothing_types': found_clothing,
        'is_multi_item': 'and' in query_lower or 'with' in query_lower,
        'original_query': query
    }

def build_enhanced_relevance_score(query, search_components):
    """FIXED: Build enhanced relevance scoring for better multi-item results"""
    conditions = []
    
    # PRIORITY 1: Exact color + clothing type combinations (highest priority)
    priority_score = 1
    for color in search_components['colors']:
        for clothing_type in search_components['clothing_types']:
            # Red t-shirt gets highest priority
            if color == 'red' and clothing_type in ['t-shirt', 'tshirt']:
                conditions.append((
                    and_(
                        Product.name.ilike(f'%{color}%'),
                        or_(
                            Product.name.ilike('%t-shirt%'),
                            Product.name.ilike('%tshirt%')
                        )
                    ), 
                    priority_score
                ))
                priority_score += 1
            else:
                conditions.append((
                    and_(
                        Product.name.ilike(f'%{color}%'),
                        Product.name.ilike(f'%{clothing_type}%')
                    ), 
                    priority_score
                ))
                priority_score += 1
    
    # PRIORITY 2: Individual clothing types (for multi-item searches)
    for clothing_type in search_components['clothing_types']:
        if clothing_type in ['t-shirt', 'tshirt']:
            conditions.append((
                or_(
                    Product.name.ilike('%t-shirt%'),
                    Product.name.ilike('%tshirt%')
                ), 
                priority_score
            ))
        else:
            conditions.append((Product.name.ilike(f'%{clothing_type}%'), priority_score))
        priority_score += 1
    
    # PRIORITY 3: Colors with general clothing
    for color in search_components['colors']:
        conditions.append((
            and_(
                Product.name.ilike(f'%{color}%'),
                or_(
                    Product.category.ilike('%clothing%'),
                    Product.name.ilike('%shirt%'),
                    Product.name.ilike('%top%'),
                    Product.name.ilike('%dress%')
                )
            ), 
            priority_score
        ))
        priority_score += 1
    
    # PRIORITY 4: Exact query match
    conditions.append((Product.name.ilike(f'%{query}%'), priority_score))
    priority_score += 1
    
    # PRIORITY 5: Individual color matches
    for color in search_components['colors']:
        conditions.append((Product.name.ilike(f'%{color}%'), priority_score))
        priority_score += 1
    
    return case(*conditions, else_=999) if conditions else text('999')

@products_bp.route('/search', methods=['GET'])
def search_products():
    """FIXED: Enhanced search with proper multi-item prioritization"""
    try:
        raw_query = request.args.get('q', '').strip()
        limit = request.args.get('limit', 50, type=int)
        category = request.args.get('category', None)
        color = request.args.get('color', None)
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        clothing_only = request.args.get('clothing_only', 'false').lower() == 'true'
        exclude_electronics = request.args.get('exclude_electronics', 'false').lower() == 'true'
        sort_by = request.args.get('sort_by', 'relevance')
        
        if not raw_query:
            return jsonify({'error': 'Search query is required'}), 400
        
        # Clean the query for consistent processing
        query = clean_search_query(raw_query)
        
        print(f"Enhanced search for: '{raw_query}' -> '{query}' with sort: {sort_by}")
        
        # Analyze the search query
        search_components = extract_search_components(query)
        is_clothing_search = detect_clothing_search(query)
        
        print(f"Search components: {search_components}")
        
        # Build base query
        search_query = Product.query
        
        # Apply price filters first
        if min_price is not None:
            search_query = search_query.filter(Product.price >= min_price)
        
        if max_price is not None:
            search_query = search_query.filter(Product.price <= max_price)
        
        # Apply category filter
        if category:
            search_query = search_query.filter(Product.category.ilike(f'%{category}%'))
        elif is_clothing_search or clothing_only:
            clothing_categories = ['clothing', 'fashion', 'apparel', 'mens', 'womens', 'kids']
            clothing_conditions = [Product.category.ilike(f'%{cat}%') for cat in clothing_categories]
            if clothing_conditions:
                search_query = search_query.filter(or_(*clothing_conditions))
        
        # Apply color filter
        if color:
            search_query = search_query.filter(or_(
                Product.name.ilike(f'%{color}%'),
                Product.description.ilike(f'%{color}%')
            ))
        
        # Exclude electronics
        if is_clothing_search or exclude_electronics:
            electronics_keywords = ['electronics', 'phone', 'computer', 'laptop', 'tablet', 'gadget', 'device', 'tech']
            exclusion_conditions = []
            for keyword in electronics_keywords:
                exclusion_conditions.append(~Product.category.ilike(f'%{keyword}%'))
                exclusion_conditions.append(~Product.name.ilike(f'%{keyword}%'))
            if exclusion_conditions:
                search_query = search_query.filter(and_(*exclusion_conditions))
        
        # FIXED: Enhanced text search logic
        if search_components['is_multi_item']:
            print("Processing multi-item search with enhanced logic")
            # For "red t-shirt with jeans" - comprehensive search
            multi_item_conditions = []
            
            # EXACT COLOR+CLOTHING COMBINATIONS (highest priority)
            for color in search_components['colors']:
                for clothing_type in search_components['clothing_types']:
                    if clothing_type in ['t-shirt', 'tshirt']:
                        multi_item_conditions.append(
                            and_(
                                Product.name.ilike(f'%{color}%'),
                                or_(
                                    Product.name.ilike('%t-shirt%'),
                                    Product.name.ilike('%tshirt%')
                                )
                            )
                        )
                    else:
                        multi_item_conditions.append(
                            and_(
                                Product.name.ilike(f'%{color}%'),
                                Product.name.ilike(f'%{clothing_type}%')
                            )
                        )
            
            # INDIVIDUAL CLOTHING ITEMS (for complete outfit)
            for clothing_type in search_components['clothing_types']:
                if clothing_type in ['t-shirt', 'tshirt']:
                    multi_item_conditions.append(
                        or_(
                            Product.name.ilike('%t-shirt%'),
                            Product.name.ilike('%tshirt%')
                        )
                    )
                else:
                    multi_item_conditions.append(Product.name.ilike(f'%{clothing_type}%'))
            
            # COLORS WITH CLOTHING CONTEXT
            for color in search_components['colors']:
                multi_item_conditions.append(
                    and_(
                        Product.name.ilike(f'%{color}%'),
                        or_(
                            Product.category.ilike('%clothing%'),
                            Product.name.ilike('%shirt%'),
                            Product.name.ilike('%top%'),
                            Product.name.ilike('%pants%'),
                            Product.name.ilike('%jeans%')
                        )
                    )
                )
            
            if multi_item_conditions:
                search_query = search_query.filter(or_(*multi_item_conditions))
                print(f"Applied {len(multi_item_conditions)} multi-item conditions")
        else:
            # Single item search
            search_terms = [term.strip() for term in query.split() if term.strip()]
            search_conditions = []
            
            for term in search_terms:
                if term.lower() in ['and', 'with', 'or', 'the', 'a', 'an', 'some']:
                    continue
                
                term_conditions = or_(
                    Product.name.ilike(f'%{term}%'),
                    Product.description.ilike(f'%{term}%'),
                    Product.category.ilike(f'%{term}%')
                )
                search_conditions.append(term_conditions)
            
            if search_conditions:
                search_query = search_query.filter(and_(*search_conditions))
        
        # Exclude irrelevant items for specific searches
        if any(term in query for term in ['t-shirt', 'tshirt', 'shirt']):
            irrelevant_items = ['brief', 'boxer', 'underwear', 'bra', 'panty', 'robe', 'nightwear', 'sleepwear', 'kurta', 'saree', 'camisole']
            exclusion_conditions = [~Product.name.ilike(f'%{item}%') for item in irrelevant_items]
            if exclusion_conditions:
                search_query = search_query.filter(and_(*exclusion_conditions))
        
        # FIXED: Build order clauses based on sort_by
        order_clauses = []
        
        if sort_by == 'relevance':
            # Use enhanced relevance scoring
            relevance_case = build_enhanced_relevance_score(query, search_components)
            order_clauses.append(relevance_case)
        elif sort_by == 'price_low':
            order_clauses.append(Product.price.asc())
        elif sort_by == 'price_high':
            order_clauses.append(Product.price.desc())
        elif sort_by == 'newest':
            order_clauses.append(Product.id.desc())
        elif sort_by == 'name':
            order_clauses.append(Product.name.asc())
        else:
            # Default to relevance
            relevance_case = build_enhanced_relevance_score(query, search_components)
            order_clauses.append(relevance_case)
        
        # Secondary sorts for consistency
        if sort_by == 'relevance':
            order_clauses.append(Product.price.asc())  # Then by price
            order_clauses.append(Product.id.desc())    # Then by newest
        elif sort_by not in ['price_low', 'price_high']:
            order_clauses.append(Product.price.asc())
        
        # Execute query
        products = search_query.order_by(*order_clauses).limit(limit).all()
        
        print(f"Found {len(products)} products. First 5 product names:")
        for i, product in enumerate(products[:5]):
            print(f"  {i+1}. {product.name} - ${product.price}")
        
        # Enhanced product processing
        result_products = []
        for product in products:
            product_dict = product.to_dict()
            
            # Enhanced relevance calculation
            name_match = query.lower() in product_dict.get('name', '').lower()
            is_clothing = any(term in product_dict.get('category', '').lower() for term in ['clothing', 'fashion', 'apparel'])
            
            color_matches = [color for color in search_components['colors'] 
                           if color in product_dict.get('name', '').lower()]
            
            clothing_matches = [item for item in search_components['clothing_types'] 
                              if item in product_dict.get('name', '').lower() or 
                                 item.replace('-', '') in product_dict.get('name', '').lower()]
            
            # Enhanced relevance scoring
            relevance_score = 0
            product_name_lower = product_dict.get('name', '').lower()
            
            # Boost for exact color+clothing combinations
            for color in search_components['colors']:
                for clothing_type in search_components['clothing_types']:
                    if color in product_name_lower and clothing_type.replace('-', '') in product_name_lower:
                        relevance_score += 50  # High boost for exact combinations
            
            # Individual component matches
            if name_match: relevance_score += 30
            relevance_score += len(color_matches) * 15
            relevance_score += len(clothing_matches) * 20
            
            # Special boost for red t-shirts when searching "red t-shirt with jeans"
            if 'red' in search_components['colors'] and any(t in search_components['clothing_types'] for t in ['t-shirt', 'tshirt']):
                if 'red' in product_name_lower and ('t-shirt' in product_name_lower or 'tshirt' in product_name_lower):
                    relevance_score += 100  # Massive boost for perfect matches
            
            product_dict['relevance_info'] = {
                'name_match': name_match,
                'is_clothing': is_clothing,
                'color_matches': color_matches,
                'clothing_matches': clothing_matches,
                'search_components': search_components,
                'relevance_score': relevance_score,
                'is_exact_match': relevance_score >= 50,
                'is_perfect_match': relevance_score >= 100,
                'cleaned_query': query
            }
            
            result_products.append(product_dict)
        
        return jsonify({
            'products': result_products,
            'total': len(result_products),
            'query': query,
            'original_query': raw_query,
            'limit': limit,
            'sort_by': sort_by,
            'search_analysis': {
                'is_clothing_search': is_clothing_search,
                'components': search_components,
                'auto_filtered_clothing': (is_clothing_search or clothing_only) and not category,
                'excluded_electronics': is_clothing_search or exclude_electronics,
                'query_cleaned': query != raw_query
            },
            'filters': {
                'category': category,
                'color': color,
                'min_price': min_price,
                'max_price': max_price,
                'clothing_only': clothing_only,
                'exclude_electronics': exclude_electronics
            }
        })
        
    except Exception as e:
        print(f"Error in enhanced search: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to search products', 'details': str(e)}), 500

# Keep suggestions route the same but with cleaning
@products_bp.route('/suggestions', methods=['GET'])
def get_search_suggestions():
    """Enhanced search suggestions with text cleaning"""
    try:
        raw_query = request.args.get('q', '').strip()
        limit = request.args.get('limit', 10, type=int)
        
        if not raw_query or len(raw_query) < 2:
            return jsonify({'suggestions': []})
        
        query = clean_search_query(raw_query)
        is_clothing_search = detect_clothing_search(query)
        
        # Build base query for suggestions
        suggestion_query = Product.query
        
        if is_clothing_search:
            clothing_categories = ['clothing', 'fashion', 'apparel', 'mens', 'womens']
            clothing_conditions = [Product.category.ilike(f'%{cat}%') for cat in clothing_categories]
            suggestion_query = suggestion_query.filter(or_(*clothing_conditions))
        
        # Get suggestions
        name_suggestions = suggestion_query.filter(
            Product.name.ilike(f'%{query}%')
        ).with_entities(Product.name).distinct().limit(limit // 2).all()
        
        category_suggestions = db.session.query(Product.category).filter(
            Product.category.ilike(f'%{query}%')
        ).distinct().limit(limit // 2).all()
        
        suggestions = []
        
        for (name,) in name_suggestions:
            if name and name not in [s['text'] for s in suggestions]:
                suggestions.append({
                    'text': name,
                    'type': 'product',
                    'category': 'Product',
                    'is_clothing': is_clothing_search
                })
        
        for (category,) in category_suggestions:
            if category and category not in [s['text'] for s in suggestions]:
                suggestions.append({
                    'text': category,
                    'type': 'category', 
                    'category': 'Category',
                    'is_clothing': 'clothing' in category.lower()
                })
        
        return jsonify({
            'suggestions': suggestions[:limit],
            'query': query,
            'original_query': raw_query,
            'is_clothing_search': is_clothing_search
        })
        
    except Exception as e:
        print(f"Error getting suggestions: {e}")
        return jsonify({'suggestions': []})



@products_bp.route('/filter', methods=['GET'])
def filter_products():
    """Enhanced product filtering with automatic clothing detection"""
    try:
        # Get filter parameters
        category = request.args.get('category', None)
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        color = request.args.get('color', None)
        style = request.args.get('style', None)
        brand = request.args.get('brand', None)
        exclude_electronics = request.args.get('exclude_electronics', 'false').lower() == 'true'
        clothing_only = request.args.get('clothing_only', 'false').lower() == 'true'
        limit = request.args.get('limit', 20, type=int)
        
        print(f"Filtering products with: category={category}, price=${min_price}-${max_price}, color={color}, clothing_only={clothing_only}")
        
        # Build query with filters
        query = Product.query
        
        # Apply category filter OR clothing filter
        if category:
            query = query.filter(Product.category.ilike(f'%{category}%'))
        elif clothing_only:
            clothing_categories = ['clothing', 'fashion', 'apparel', 'mens', 'womens', 'kids']
            clothing_conditions = [Product.category.ilike(f'%{cat}%') for cat in clothing_categories]
            if clothing_conditions:
                query = query.filter(or_(*clothing_conditions))
        
        # Exclude electronics if requested
        if exclude_electronics or clothing_only:
            electronics_keywords = ['electronics', 'phone', 'computer', 'laptop', 'tablet', 'gadget', 'device']
            exclusion_conditions = []
            for keyword in electronics_keywords:
                exclusion_conditions.append(~Product.category.ilike(f'%{keyword}%'))
                exclusion_conditions.append(~Product.name.ilike(f'%{keyword}%'))
            if exclusion_conditions:
                query = query.filter(and_(*exclusion_conditions))
        
        # Apply price filters
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        
        # Apply color filter
        if color:
            query = query.filter(or_(
                Product.name.ilike(f'%{color}%'),
                Product.description.ilike(f'%{color}%')
            ))
        
        # Apply style filter
        if style:
            query = query.filter(or_(
                Product.name.ilike(f'%{style}%'),
                Product.description.ilike(f'%{style}%')
            ))
        
        # Apply brand filter
        if brand:
            query = query.filter(Product.name.ilike(f'%{brand}%'))
        
        # Execute query with intelligent ordering
        order_clauses = []
        
        # Prioritize clothing items if clothing_only is true
        if clothing_only:
            order_clauses.append(
                case(
                    (Product.category.ilike('%clothing%'), 1),
                    (Product.category.ilike('%fashion%'), 2),
                    else_=3
                )
            )
        
        order_clauses.append(Product.price.asc())
        
        products = query.order_by(*order_clauses).limit(limit).all()
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'total': len(products),
            'filters_applied': {
                'category': category,
                'min_price': min_price,
                'max_price': max_price,
                'color': color,
                'style': style,
                'brand': brand,
                'exclude_electronics': exclude_electronics,
                'clothing_only': clothing_only
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
        clothing_only = request.args.get('clothing_only', 'false').lower() == 'true'
        
        # Build query
        query = Product.query
        
        # Apply filters
        if category:
            query = query.filter(Product.category.ilike(f'%{category}%'))
        elif clothing_only:
            clothing_categories = ['clothing', 'fashion', 'apparel']
            clothing_conditions = [Product.category.ilike(f'%{cat}%') for cat in clothing_categories]
            if clothing_conditions:
                query = query.filter(or_(*clothing_conditions))
        
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        
        # Order by ID descending (latest first) and apply limit
        products = query.order_by(desc(Product.id)).limit(limit).all()
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'total': len(products),
            'limit': limit,
            'category': category,
            'max_price': max_price,
            'clothing_only': clothing_only
        })
        
    except Exception as e:
        print(f"Error in get_latest_products: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch latest products', 'details': str(e)}), 500

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all unique product categories with enhanced filtering"""
    try:
        exclude_electronics = request.args.get('exclude_electronics', 'false').lower() == 'true'
        
        # Build base query
        categories_query = db.session.query(
            Product.category,
            func.count(Product.id).label('count')
        ).group_by(Product.category)
        
        # Exclude electronics if requested
        if exclude_electronics:
            electronics_keywords = ['electronics', 'phone', 'computer', 'laptop', 'tablet']
            exclusion_conditions = [~Product.category.ilike(f'%{keyword}%') for keyword in electronics_keywords]
            if exclusion_conditions:
                categories_query = categories_query.filter(and_(*exclusion_conditions))
        
        categories_with_counts = categories_query.all()
        
        category_list = []
        for category, count in categories_with_counts:
            if category:  # Exclude None/empty categories
                category_list.append({
                    'name': category,
                    'count': count,
                    'is_clothing': any(term in category.lower() for term in ['clothing', 'fashion', 'apparel'])
                })
        
        # Sort by count (most popular first)
        category_list.sort(key=lambda x: x['count'], reverse=True)
        
        return jsonify({
            'categories': [cat['name'] for cat in category_list],  # Simple list for frontend
            'categories_with_counts': category_list,
            'total': len(category_list),
            'exclude_electronics': exclude_electronics
        })
        
    except Exception as e:
        print(f"Error in get_categories: {e}")
        return jsonify({'error': 'Failed to fetch categories', 'details': str(e)}), 500
@products_bp.route('/related/<product_id>', methods=['GET'])
def get_related_products(product_id):
    """Get related products based on category and other factors"""
    try:
        limit = request.args.get('limit', 8, type=int)
        
        # Get the current product first
        current_product = Product.query.filter_by(id=product_id).first()
        if not current_product:
            return jsonify({'error': 'Product not found'}), 404
        
        print(f"Finding related products for: {current_product.name} (Category: {current_product.category})")
        
        # Build related products query
        related_query = Product.query.filter(Product.id != product_id)
        
        # Strategy 1: Same category first
        category_products = []
        if current_product.category:
            category_products = related_query.filter(
                Product.category.ilike(f'%{current_product.category}%')
            ).limit(limit).all()
            print(f"Found {len(category_products)} products in same category")
        
        # Strategy 2: If not enough, get products with similar keywords
        if len(category_products) < limit:
            # Extract keywords from product name
            name_words = current_product.name.lower().split()
            clothing_keywords = ['shirt', 't-shirt', 'jeans', 'pants', 'dress', 'jacket', 'top', 'hoodie']
            
            # Find clothing keywords in product name
            found_keywords = [word for word in name_words if word in clothing_keywords]
            
            if found_keywords:
                keyword_conditions = [Product.name.ilike(f'%{keyword}%') for keyword in found_keywords]
                keyword_products = related_query.filter(
                    or_(*keyword_conditions)
                ).limit(limit - len(category_products)).all()
                category_products.extend(keyword_products)
                print(f"Added {len(keyword_products)} products from keyword search")
        
        # Strategy 3: If still not enough, get general clothing items
        if len(category_products) < limit:
            clothing_categories = ['clothing', 'fashion', 'apparel', 'mens', 'womens']
            clothing_conditions = [Product.category.ilike(f'%{cat}%') for cat in clothing_categories]
            
            general_products = related_query.filter(
                or_(*clothing_conditions)
            ).limit(limit - len(category_products)).all()
            category_products.extend(general_products)
            print(f"Added {len(general_products)} general clothing products")
        
        # Remove duplicates and limit results
        seen_ids = set()
        unique_products = []
        for product in category_products:
            if product.id not in seen_ids:
                unique_products.append(product)
                seen_ids.add(product.id)
            if len(unique_products) >= limit:
                break
        
        # Convert to dict
        result_products = [product.to_dict() for product in unique_products]
        
        print(f"Returning {len(result_products)} related products")
        
        return jsonify({
            'products': result_products,
            'total': len(result_products),
            'current_product': current_product.to_dict()
        })
        
    except Exception as e:
        print(f"Error getting related products: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to get related products', 'details': str(e)}), 500

@products_bp.route('/category/<category_name>', methods=['GET'])
def get_products_by_category(category_name):
    """Get products by category for related products"""
    try:
        limit = request.args.get('limit', 12, type=int)
        exclude_id = request.args.get('exclude_id', None)
        
        print(f"Getting products for category: {category_name}")
        
        # Build query
        query = Product.query.filter(
            or_(
                Product.category.ilike(f'%{category_name}%'),
                Product.name.ilike(f'%{category_name}%')
            )
        )
        
        # Exclude current product
        if exclude_id:
            query = query.filter(Product.id != exclude_id)
        
        # Always include clothing filter for fashion website
        clothing_categories = ['clothing', 'fashion', 'apparel', 'mens', 'womens']
        clothing_conditions = [Product.category.ilike(f'%{cat}%') for cat in clothing_categories]
        query = query.filter(or_(*clothing_conditions))
        
        products = query.limit(limit).all()
        
        print(f"Found {len(products)} products for category {category_name}")
        
        return jsonify({
            'products': [product.to_dict() for product in products],
            'total': len(products),
            'category': category_name
        })
        
    except Exception as e:
        print(f"Error getting products by category: {e}")
        return jsonify({'error': 'Failed to get products', 'details': str(e)}), 500
@products_bp.route('/trending', methods=['GET'])
def get_trending_products():
    """Get trending products with enhanced clothing support"""
    try:
        from database.models import UserHistory
        
        limit = request.args.get('limit', 12, type=int)
        category = request.args.get('category', None)
        max_price = request.args.get('max_price', type=float)
        clothing_only = request.args.get('clothing_only', 'false').lower() == 'true'
        
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
        elif clothing_only:
            clothing_categories = ['clothing', 'fashion', 'apparel']
            clothing_conditions = [Product.category.ilike(f'%{cat}%') for cat in clothing_categories]
            if clothing_conditions:
                trending_query = trending_query.filter(or_(*clothing_conditions))
        
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
            
            latest_query = Product.query
            if trending_ids:
                latest_query = latest_query.filter(~Product.id.in_(trending_ids))
            
            # Apply same filters to latest products
            if category:
                latest_query = latest_query.filter(Product.category.ilike(f'%{category}%'))
            elif clothing_only:
                clothing_categories = ['clothing', 'fashion', 'apparel']
                clothing_conditions = [Product.category.ilike(f'%{cat}%') for cat in clothing_categories]
                if clothing_conditions:
                    latest_query = latest_query.filter(or_(*clothing_conditions))
            
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
            'max_price': max_price,
            'clothing_only': clothing_only
        })
        
    except Exception as e:
        print(f"Error in get_trending_products: {e}")
        # Enhanced fallback
        try:
            fallback_query = Product.query
            
            # Apply filters to fallback
            if category:
                fallback_query = fallback_query.filter(Product.category.ilike(f'%{category}%'))
            elif clothing_only:
                clothing_categories = ['clothing', 'fashion', 'apparel']
                clothing_conditions = [Product.category.ilike(f'%{cat}%') for cat in clothing_categories]
                if clothing_conditions:
                    fallback_query = fallback_query.filter(or_(*clothing_conditions))
            
            if max_price is not None:
                fallback_query = fallback_query.filter(Product.price <= max_price)
            
            products = fallback_query.order_by(desc(Product.id)).limit(limit).all()
            
            return jsonify({
                'products': [product.to_dict() for product in products],
                'total': len(products),
                'limit': limit,
                'fallback': True,
                'category': category,
                'max_price': max_price,
                'clothing_only': clothing_only
            })
        except Exception as fallback_error:
            return jsonify({'error': 'Failed to fetch trending products', 'details': str(e)}), 500
