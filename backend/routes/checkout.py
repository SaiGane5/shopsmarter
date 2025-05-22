from flask import Blueprint, request, jsonify
import stripe
import os
from database.models import db, Product, User, UserHistory

checkout_bp = Blueprint('checkout', __name__)

# Set Stripe API key
stripe.api_key = os.environ.get('STRIPE_API_KEY', 'sk_test_tR3PYbcVNZZ796tH88S4VQ2u')

@checkout_bp.route('/create-session', methods=['POST'])
def create_checkout_session():
    data = request.json
    
    if not data or 'products' not in data:
        return jsonify({'error': 'No products provided'}), 400
    
    product_ids = data['products']
    user_id = data.get('user_id')
    
    line_items = []
    for product_id in product_ids:
        product = Product.query.get(product_id)
        if product:
            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': product.name,
                        'description': product.description,
                        'images': [product.image_url]
                    },
                    'unit_amount': int(product.price * 100),  # Convert to cents
                },
                'quantity': 1,
            })
            
            # Record user interaction if user_id is provided
            if user_id:
                history = UserHistory(
                    user_id=user_id,
                    product_id=product_id,
                    interaction_type='checkout'
                )
                db.session.add(history)
        
    if user_id:
        db.session.commit()
    
    if not line_items:
        return jsonify({'error': 'No valid products found'}), 400
    
    # Create a Stripe checkout session
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=request.headers.get('Origin', '') + '/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.headers.get('Origin', '') + '/cancel',
        )
        return jsonify({'id': checkout_session.id})
    except Exception as e:
        return jsonify({'error': str(e)}), 400
