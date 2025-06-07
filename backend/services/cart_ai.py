import json
import traceback
from datetime import datetime, timedelta
from database.models import db, Product, User, UserHistory
from services.vector_search import find_similar_products, get_complementary_products
from services.nlp_agent import refine_recommendations
from sqlalchemy import func, desc, and_, or_
import random

class CartAI:
    def __init__(self):
        self.bundle_rules = {
            'clothing_bundle': {
                'categories': ['clothing'],
                'min_items': 2,
                'discount': 0.15,
                'name': 'Complete Outfit Discount'
            },
            'accessories_bundle': {
                'categories': ['accessories', 'shoes'],
                'min_items': 2,
                'discount': 0.10,
                'name': 'Accessories Bundle'
            },
            'volume_discount': {
                'min_quantity': 3,
                'discount': 0.12,
                'name': 'Volume Discount'
            }
        }
    
    def analyze_cart(self, cart_items, user_id=None):
        """
        Comprehensive cart analysis with all AI features
        """
        try:
            analysis = {
                'personalized_suggestions': self.get_personalized_suggestions(cart_items, user_id),
                'dynamic_pricing': self.calculate_dynamic_pricing(cart_items, user_id),
                'smart_behaviors': self.get_smart_behaviors(cart_items, user_id),
                'purchase_predictions': self.predict_purchase_behavior(cart_items, user_id),
                'cart_optimization': self.optimize_cart(cart_items)
            }
            
            return analysis
            
        except Exception as e:
            print(f"Error in cart analysis: {e}")
            traceback.print_exc()
            return self.get_fallback_analysis(cart_items)
    
    def get_personalized_suggestions(self, cart_items, user_id=None):
        """
        Generate personalized product suggestions
        """
        try:
            suggestions = {
                'frequently_bought_together': [],
                'complete_the_look': [],
                'you_may_also_like': [],
                'trending_additions': []
            }
            
            if not cart_items:
                return suggestions
            
            # Frequently Bought Together
            for item in cart_items[:2]:  # Limit to avoid overwhelming
                try:
                    product = Product.query.get(item.get('id'))
                    if product:
                        # Get complementary products
                        complementary = get_complementary_products(product, limit=3)
                        for comp in complementary:
                            comp_dict = comp.to_dict()
                            comp_dict['reason'] = f"Often bought with {product.name}"
                            comp_dict['confidence'] = 0.8
                            suggestions['frequently_bought_together'].append(comp_dict)
                except Exception as e:
                    print(f"Error getting complementary for {item}: {e}")
                    continue
            
            # Complete the Look (for clothing items)
            clothing_items = [item for item in cart_items if 'clothing' in str(item.get('category', '')).lower()]
            if clothing_items:
                for clothing_item in clothing_items[:2]:
                    try:
                        # Extract features from clothing item
                        item_features = self.extract_item_features(clothing_item)
                        if item_features:
                            similar_products = find_similar_products(item_features, limit=3)
                            for product_id in similar_products:
                                try:
                                    product = Product.query.get(product_id)
                                    if product and product.id not in [ci.get('id') for ci in cart_items]:
                                        product_dict = product.to_dict()
                                        product_dict['reason'] = f"Completes your {clothing_item.get('name', 'outfit')}"
                                        product_dict['confidence'] = 0.7
                                        suggestions['complete_the_look'].append(product_dict)
                                except Exception as e:
                                    continue
                    except Exception as e:
                        continue
            
            # You May Also Like (based on user history)
            if user_id:
                try:
                    user_history = UserHistory.query.filter_by(user_id=user_id).order_by(desc(UserHistory.created_at)).limit(10).all()
                    if user_history:
                        # Get categories user likes
                        liked_categories = []
                        for history in user_history:
                            product = Product.query.get(history.product_id)
                            if product and product.category:
                                liked_categories.append(product.category.lower())
                        
                        # Find products in liked categories not in cart
                        if liked_categories:
                            most_liked_category = max(set(liked_categories), key=liked_categories.count)
                            similar_products = Product.query.filter(
                                Product.category.ilike(f'%{most_liked_category}%'),
                                ~Product.id.in_([item.get('id') for item in cart_items])
                            ).order_by(func.random()).limit(4).all()
                            
                            for product in similar_products:
                                product_dict = product.to_dict()
                                product_dict['reason'] = f"Based on your interest in {most_liked_category}"
                                product_dict['confidence'] = 0.6
                                suggestions['you_may_also_like'].append(product_dict)
                except Exception as e:
                    print(f"Error getting user history suggestions: {e}")
            
            # Trending Additions (popular products)
            try:
                trending = Product.query.order_by(func.random()).limit(3).all()
                for product in trending:
                    if product.id not in [item.get('id') for item in cart_items]:
                        product_dict = product.to_dict()
                        product_dict['reason'] = "Trending now"
                        product_dict['confidence'] = 0.5
                        suggestions['trending_additions'].append(product_dict)
            except Exception as e:
                print(f"Error getting trending: {e}")
            
            # Limit suggestions to avoid overwhelming
            for key in suggestions:
                suggestions[key] = suggestions[key][:3]
            
            return suggestions
            
        except Exception as e:
            print(f"Error getting personalized suggestions: {e}")
            return {
                'frequently_bought_together': [],
                'complete_the_look': [],
                'you_may_also_like': [],
                'trending_additions': []
            }
    
    def calculate_dynamic_pricing(self, cart_items, user_id=None):
        """
        Calculate dynamic pricing with AI-driven discounts
        """
        try:
            pricing = {
                'original_total': 0,
                'discounts': [],
                'final_total': 0,
                'savings': 0,
                'shipping': 0,
                'free_shipping_eligible': False,
                'recommendations': []
            }
            
            if not cart_items:
                return pricing
            
            # Calculate original total
            original_total = sum(item.get('price', 0) * item.get('quantity', 1) for item in cart_items)
            pricing['original_total'] = original_total
            
            total_discount = 0
            
            # Bundle Discounts
            clothing_items = [item for item in cart_items if 'clothing' in str(item.get('category', '')).lower()]
            accessories_items = [item for item in cart_items if any(cat in str(item.get('category', '')).lower() for cat in ['accessories', 'shoes'])]
            
            # Clothing Bundle Discount
            if len(clothing_items) >= 2:
                bundle_discount = original_total * 0.15
                total_discount += bundle_discount
                pricing['discounts'].append({
                    'type': 'bundle',
                    'name': 'Complete Outfit Discount',
                    'amount': bundle_discount,
                    'description': '15% off when you buy 2+ clothing items'
                })
            
            # Accessories Bundle
            if len(accessories_items) >= 2:
                accessories_total = sum(item.get('price', 0) * item.get('quantity', 1) for item in accessories_items)
                bundle_discount = accessories_total * 0.10
                total_discount += bundle_discount
                pricing['discounts'].append({
                    'type': 'bundle',
                    'name': 'Accessories Bundle',
                    'amount': bundle_discount,
                    'description': '10% off when you buy 2+ accessories'
                })
            
            # Volume Discount
            total_quantity = sum(item.get('quantity', 1) for item in cart_items)
            if total_quantity >= 3:
                volume_discount = original_total * 0.12
                total_discount += volume_discount
                pricing['discounts'].append({
                    'type': 'volume',
                    'name': 'Volume Discount',
                    'amount': volume_discount,
                    'description': f'12% off for buying {total_quantity} items'
                })
            
            # First Time Buyer Discount (if user_id and no previous orders)
            if user_id:
                try:
                    previous_orders = UserHistory.query.filter_by(user_id=user_id).count()
                    if previous_orders == 0:
                        first_time_discount = original_total * 0.08
                        total_discount += first_time_discount
                        pricing['discounts'].append({
                            'type': 'welcome',
                            'name': 'Welcome Discount',
                            'amount': first_time_discount,
                            'description': '8% off for first-time customers'
                        })
                except Exception as e:
                    print(f"Error checking first time buyer: {e}")
            
            # Shipping Calculation
            subtotal_after_discount = original_total - total_discount
            if subtotal_after_discount >= 75:
                pricing['shipping'] = 0
                pricing['free_shipping_eligible'] = True
                pricing['recommendations'].append({
                    'type': 'shipping',
                    'message': 'Congratulations! You qualify for free shipping.'
                })
            else:
                pricing['shipping'] = 10
                needed_for_free_shipping = 75 - subtotal_after_discount
                pricing['recommendations'].append({
                    'type': 'shipping',
                    'message': f'Add ${needed_for_free_shipping:.2f} more for free shipping!'
                })
            
            # Limited Time Offers
            current_hour = datetime.now().hour
            if 14 <= current_hour <= 16:  # 2 PM - 4 PM
                flash_discount = original_total * 0.05
                total_discount += flash_discount
                pricing['discounts'].append({
                    'type': 'flash',
                    'name': 'Flash Sale',
                    'amount': flash_discount,
                    'description': '5% off - Limited time offer (2 PM - 4 PM)'
                })
            
            pricing['final_total'] = max(0, original_total - total_discount + pricing['shipping'])
            pricing['savings'] = total_discount
            
            return pricing
            
        except Exception as e:
            print(f"Error calculating dynamic pricing: {e}")
            return {
                'original_total': sum(item.get('price', 0) * item.get('quantity', 1) for item in cart_items),
                'discounts': [],
                'final_total': sum(item.get('price', 0) * item.get('quantity', 1) for item in cart_items),
                'savings': 0,
                'shipping': 10,
                'free_shipping_eligible': False,
                'recommendations': []
            }
    
    def get_smart_behaviors(self, cart_items, user_id=None):
        """
        Generate smart cart behaviors and recommendations
        """
        try:
            behaviors = {
                'size_recommendations': [],
                'stock_alerts': [],
                'price_alerts': [],
                'optimization_tips': [],
                'urgency_indicators': []
            }
            
            if not cart_items:
                return behaviors
            
            # Size Recommendations (mock - in real app, you'd have user size history)
            clothing_items = [item for item in cart_items if 'clothing' in str(item.get('category', '')).lower()]
            for item in clothing_items:
                if user_id:
                    # Mock size recommendation based on user history
                    behaviors['size_recommendations'].append({
                        'product_id': item.get('id'),
                        'product_name': item.get('name'),
                        'recommended_size': 'M',
                        'confidence': 0.8,
                        'reason': 'Based on your previous orders, size M fits you best'
                    })
            
            # Stock Alerts (mock - simulate low stock)
            for item in cart_items:
                stock_level = random.randint(1, 15)  # Mock stock level
                if stock_level <= 3:
                    behaviors['stock_alerts'].append({
                        'product_id': item.get('id'),
                        'product_name': item.get('name'),
                        'stock_level': stock_level,
                        'urgency': 'high' if stock_level <= 1 else 'medium',
                        'message': f'Only {stock_level} left in stock!'
                    })
            
            # Price Alerts (mock - simulate price changes)
            for item in cart_items:
                if random.random() < 0.3:  # 30% chance of price drop
                    price_drop = round(random.uniform(2, 10), 2)
                    behaviors['price_alerts'].append({
                        'product_id': item.get('id'),
                        'product_name': item.get('name'),
                        'price_drop': price_drop,
                        'message': f'Great news! This item dropped ${price_drop} since you added it'
                    })
            
            # Optimization Tips
            total_value = sum(item.get('price', 0) * item.get('quantity', 1) for item in cart_items)
            
            if total_value < 75:
                needed = 75 - total_value
                behaviors['optimization_tips'].append({
                    'type': 'shipping',
                    'message': f'Add ${needed:.2f} more for free shipping',
                    'action': 'add_items'
                })
            
            if len(cart_items) == 1:
                behaviors['optimization_tips'].append({
                    'type': 'bundle',
                    'message': 'Add one more clothing item for 15% off your entire order',
                    'action': 'suggest_bundle'
                })
            
            # Urgency Indicators
            if len(behaviors['stock_alerts']) > 0:
                behaviors['urgency_indicators'].append({
                    'type': 'stock',
                    'level': 'high',
                    'message': 'Items in your cart are running low - complete your purchase soon!'
                })
            
            # Time-based urgency
            current_hour = datetime.now().hour
            if 20 <= current_hour <= 23:  # Evening hours
                behaviors['urgency_indicators'].append({
                    'type': 'time',
                    'level': 'medium',
                    'message': 'Complete your order by midnight for next-day processing'
                })
            
            return behaviors
            
        except Exception as e:
            print(f"Error getting smart behaviors: {e}")
            return {
                'size_recommendations': [],
                'stock_alerts': [],
                'price_alerts': [],
                'optimization_tips': [],
                'urgency_indicators': []
            }
    
    def predict_purchase_behavior(self, cart_items, user_id=None):
        """
        Predict purchase behavior and likelihood
        """
        try:
            predictions = {
                'completion_probability': 0.5,
                'abandonment_risk': 'medium',
                'next_likely_purchases': [],
                'seasonal_recommendations': [],
                'intervention_suggestions': []
            }
            
            if not cart_items:
                return predictions
            
            # Calculate completion probability based on cart characteristics
            probability_factors = 0.5  # Base probability
            
            # Higher value carts have higher completion probability
            total_value = sum(item.get('price', 0) * item.get('quantity', 1) for item in cart_items)
            if total_value > 100:
                probability_factors += 0.2
            elif total_value > 50:
                probability_factors += 0.1
            
            # Multiple items increase probability
            if len(cart_items) > 1:
                probability_factors += 0.15
            
            # Discounts increase probability
            if total_value > 75:  # Free shipping threshold
                probability_factors += 0.1
            
            # Cap at 0.95
            predictions['completion_probability'] = min(0.95, probability_factors)
            
            # Determine abandonment risk
            if predictions['completion_probability'] > 0.7:
                predictions['abandonment_risk'] = 'low'
            elif predictions['completion_probability'] > 0.4:
                predictions['abandonment_risk'] = 'medium'
            else:
                predictions['abandonment_risk'] = 'high'
            
            # Next Likely Purchases (based on current cart)
            for item in cart_items[:2]:
                try:
                    product = Product.query.get(item.get('id'))
                    if product:
                        complementary = get_complementary_products(product, limit=2)
                        for comp in complementary:
                            predictions['next_likely_purchases'].append({
                                'product': comp.to_dict(),
                                'probability': 0.6,
                                'reason': f'Commonly bought after {product.name}'
                            })
                except Exception as e:
                    continue
            
            # Seasonal Recommendations
            current_month = datetime.now().month
            if 11 <= current_month <= 12:  # Winter season
                predictions['seasonal_recommendations'] = [
                    {
                        'category': 'winter_wear',
                        'message': 'Winter is coming - consider adding jackets and warm accessories',
                        'urgency': 'medium'
                    }
                ]
            elif 3 <= current_month <= 5:  # Spring season
                predictions['seasonal_recommendations'] = [
                    {
                        'category': 'spring_wear',
                        'message': 'Spring collection now available - light fabrics and bright colors',
                        'urgency': 'low'
                    }
                ]
            
            # Intervention Suggestions based on abandonment risk
            if predictions['abandonment_risk'] == 'high':
                predictions['intervention_suggestions'] = [
                    {
                        'type': 'discount',
                        'message': 'Get 5% off if you complete your purchase in the next 10 minutes',
                        'action': 'apply_urgency_discount'
                    },
                    {
                        'type': 'assistance',
                        'message': 'Need help deciding? Chat with our style assistant',
                        'action': 'offer_chat'
                    }
                ]
            elif predictions['abandonment_risk'] == 'medium':
                predictions['intervention_suggestions'] = [
                    {
                        'type': 'social_proof',
                        'message': f'{random.randint(15, 45)} other customers have this item in their cart',
                        'action': 'show_popularity'
                    }
                ]
            
            return predictions
            
        except Exception as e:
            print(f"Error predicting purchase behavior: {e}")
            return {
                'completion_probability': 0.5,
                'abandonment_risk': 'medium',
                'next_likely_purchases': [],
                'seasonal_recommendations': [],
                'intervention_suggestions': []
            }
    
    def optimize_cart(self, cart_items):
        """
        Suggest cart optimizations
        """
        try:
            optimizations = {
                'suggested_bundles': [],
                'better_alternatives': [],
                'cost_optimizations': []
            }
            
            if not cart_items:
                return optimizations
            
            # Suggest bundles for single items
            if len(cart_items) == 1:
                item = cart_items[0]
                try:
                    product = Product.query.get(item.get('id'))
                    if product:
                        complementary = get_complementary_products(product, limit=2)
                        if complementary:
                            bundle_price = item.get('price', 0) + sum(p.price for p in complementary)
                            discount_price = bundle_price * 0.85  # 15% off
                            optimizations['suggested_bundles'].append({
                                'main_item': item,
                                'complementary_items': [p.to_dict() for p in complementary],
                                'original_price': bundle_price,
                                'bundle_price': discount_price,
                                'savings': bundle_price - discount_price,
                                'message': 'Complete the look and save 15%'
                            })
                except Exception as e:
                    print(f"Error creating bundle suggestion: {e}")
            
            # Cost optimizations
            total_value = sum(item.get('price', 0) * item.get('quantity', 1) for item in cart_items)
            if total_value < 75:
                needed = 75 - total_value
                optimizations['cost_optimizations'].append({
                    'type': 'free_shipping',
                    'message': f'Add ${needed:.2f} more for free shipping (saves $10)',
                    'target_amount': needed,
                    'potential_savings': 10
                })
            
            return optimizations
            
        except Exception as e:
            print(f"Error optimizing cart: {e}")
            return {
                'suggested_bundles': [],
                'better_alternatives': [],
                'cost_optimizations': []
            }
    
    def extract_item_features(self, item):
        """
        Extract features from cart item for similarity search
        """
        try:
            features = {
                'main_category': 'clothing',
                'subcategory': 'item',
                'primary_colors': ['unknown'],
                'accent_colors': [],
                'patterns': ['solid'],
                'style': ['casual'],
                'material': 'unknown',
                'brand': 'unknown',
                'gender': 'unisex',
                'age_group': 'adult',
                'person_detected': False,
                'confidence': 0.7
            }
            
            item_name = str(item.get('name', '')).lower()
            item_category = str(item.get('category', '')).lower()
            
            # Extract gender
            if any(term in item_name for term in ['women', 'woman', 'female', 'ladies']):
                features['gender'] = 'women'
            elif any(term in item_name for term in ['men', 'man', 'male', 'guys']):
                features['gender'] = 'men'
            
            # Extract category
            if 'clothing' in item_category:
                features['main_category'] = 'clothing'
                if any(term in item_name for term in ['shirt', 't-shirt', 'top']):
                    features['subcategory'] = 't-shirt'
                elif 'dress' in item_name:
                    features['subcategory'] = 'dress'
                elif any(term in item_name for term in ['pants', 'jeans']):
                    features['subcategory'] = 'pants'
            
            # Extract colors
            colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'brown']
            for color in colors:
                if color in item_name:
                    features['primary_colors'] = [color]
                    break
            
            return features
            
        except Exception as e:
            print(f"Error extracting item features: {e}")
            return None
    
    def get_fallback_analysis(self, cart_items):
        """
        Fallback analysis when main analysis fails
        """
        return {
            'personalized_suggestions': {
                'frequently_bought_together': [],
                'complete_the_look': [],
                'you_may_also_like': [],
                'trending_additions': []
            },
            'dynamic_pricing': {
                'original_total': sum(item.get('price', 0) * item.get('quantity', 1) for item in cart_items),
                'discounts': [],
                'final_total': sum(item.get('price', 0) * item.get('quantity', 1) for item in cart_items),
                'savings': 0,
                'shipping': 10,
                'free_shipping_eligible': False,
                'recommendations': []
            },
            'smart_behaviors': {
                'size_recommendations': [],
                'stock_alerts': [],
                'price_alerts': [],
                'optimization_tips': [],
                'urgency_indicators': []
            },
            'purchase_predictions': {
                'completion_probability': 0.5,
                'abandonment_risk': 'medium',
                'next_likely_purchases': [],
                'seasonal_recommendations': [],
                'intervention_suggestions': []
            },
            'cart_optimization': {
                'suggested_bundles': [],
                'better_alternatives': [],
                'cost_optimizations': []
            }
        }
