from flask import Blueprint, request, jsonify
import stripe
import os
from database.models import db, Product, User, UserHistory
from services.cart_ai import CartAI
import uuid
import traceback

# Load environment variables
load_dotenv()

checkout_bp = Blueprint('checkout', __name__)

# Initialize AI Cart service
cart_ai = CartAI()

# Set Stripe API key from environment
stripe.api_key = os.getenv('STRIPE_API_KEY')

@checkout_bp.route('/analyze-cart', methods=['POST'])
def analyze_cart():
    """
    AI-powered cart analysis endpoint
    """
    try:
        data = request.json
        if not data or 'cart_items' not in data:
            return jsonify({'error': 'Cart items are required'}), 400
        
        cart_items = data['cart_items']
        user_id = data.get('user_id')
        
        print(f"Analyzing cart with {len(cart_items)} items for user {user_id}")
        
        # Perform comprehensive AI analysis
        analysis = cart_ai.analyze_cart(cart_items, user_id)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        print(f"Error in cart analysis: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to analyze cart', 'details': str(e)}), 500

@checkout_bp.route('/get-suggestions', methods=['POST'])
def get_cart_suggestions():
    """
    Get personalized suggestions for cart
    """
    try:
        data = request.json
        if not data or 'cart_items' not in data:
            return jsonify({'error': 'Cart items are required'}), 400
        
        cart_items = data['cart_items']
        user_id = data.get('user_id')
        suggestion_type = data.get('type', 'all')  # 'frequently_bought', 'complete_look', etc.
        
        # Get personalized suggestions
        suggestions = cart_ai.get_personalized_suggestions(cart_items, user_id)
        
        if suggestion_type != 'all' and suggestion_type in suggestions:
            suggestions = {suggestion_type: suggestions[suggestion_type]}
        
        return jsonify({
            'success': True,
            'suggestions': suggestions
        })
        
    except Exception as e:
        print(f"Error getting suggestions: {e}")
        return jsonify({'error': 'Failed to get suggestions', 'details': str(e)}), 500

@checkout_bp.route('/calculate-pricing', methods=['POST'])
def calculate_smart_pricing():
    """
    Calculate dynamic pricing with AI discounts
    """
    try:
        data = request.json
        if not data or 'cart_items' not in data:
            return jsonify({'error': 'Cart items are required'}), 400
        
        cart_items = data['cart_items']
        user_id = data.get('user_id')
        
        # Calculate dynamic pricing
        pricing = cart_ai.calculate_dynamic_pricing(cart_items, user_id)
        
        return jsonify({
            'success': True,
            'pricing': pricing
        })
        
    except Exception as e:
        print(f"Error calculating pricing: {e}")
        return jsonify({'error': 'Failed to calculate pricing', 'details': str(e)}), 500

@checkout_bp.route('/smart-behaviors', methods=['POST'])
def get_smart_behaviors():
    """
    Get smart cart behaviors and alerts
    """
    try:
        data = request.json
        if not data or 'cart_items' not in data:
            return jsonify({'error': 'Cart items are required'}), 400
        
        cart_items = data['cart_items']
        user_id = data.get('user_id')
        
        # Get smart behaviors
        behaviors = cart_ai.get_smart_behaviors(cart_items, user_id)
        
        return jsonify({
            'success': True,
            'behaviors': behaviors
        })
        
    except Exception as e:
        print(f"Error getting smart behaviors: {e}")
        return jsonify({'error': 'Failed to get smart behaviors', 'details': str(e)}), 500

@checkout_bp.route('/predict-behavior', methods=['POST'])
def predict_purchase_behavior():
    """
    Predict purchase completion and behavior
    """
    try:
        data = request.json
        if not data or 'cart_items' not in data:
            return jsonify({'error': 'Cart items are required'}), 400
        
        cart_items = data['cart_items']
        user_id = data.get('user_id')
        
        # Get purchase predictions
        predictions = cart_ai.predict_purchase_behavior(cart_items, user_id)
        
        return jsonify({
            'success': True,
            'predictions': predictions
        })
        
    except Exception as e:
        print(f"Error predicting behavior: {e}")
        return jsonify({'error': 'Failed to predict behavior', 'details': str(e)}), 500

@checkout_bp.route('/create-session', methods=['POST'])
def create_checkout_session():
    """
    Enhanced checkout session with AI pricing
    """
    try:
        data = request.json
        if not data or 'products' not in data or not data['products']:
            return jsonify({'error': 'No products provided'}), 400

        products = data['products']
        user_id = data.get('user_id')
        cart_items = data.get('cart_items', [])
        
        # Calculate AI-enhanced pricing
        if cart_items:
            pricing = cart_ai.calculate_dynamic_pricing(cart_items, user_id)
            final_total = pricing['final_total']
            
            # Record the discounts applied
            print(f"AI Pricing Applied: Original: ${pricing['original_total']:.2f}, Final: ${final_total:.2f}, Savings: ${pricing['savings']:.2f}")
        
        # Simulate a payment session creation with AI pricing
        fake_session_id = str(uuid.uuid4())
        
        return jsonify({
            'id': fake_session_id,
            'ai_pricing_applied': bool(cart_items),
            'total_savings': pricing.get('savings', 0) if cart_items else 0
        })
        
    except Exception as e:
        print(f"Error creating checkout session: {e}")
        return jsonify({'error': 'Failed to create checkout session', 'details': str(e)}), 500

@checkout_bp.route('/optimize-cart', methods=['POST'])
def optimize_cart():
    """
    Get cart optimization suggestions
    """
    try:
        data = request.json
        if not data or 'cart_items' not in data:
            return jsonify({'error': 'Cart items are required'}), 400
        
        cart_items = data['cart_items']
        
        # Get optimization suggestions
        optimizations = cart_ai.optimize_cart(cart_items)
        
        return jsonify({
            'success': True,
            'optimizations': optimizations
        })
        
    except Exception as e:
        print(f"Error optimizing cart: {e}")
        return jsonify({'error': 'Failed to optimize cart', 'details': str(e)}), 500
