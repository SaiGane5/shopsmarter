from flask import Blueprint, request, jsonify
import stripe
import os
from database.models import db, Product, User, UserHistory
import uuid

checkout_bp = Blueprint('checkout', __name__)

# Set Stripe API key
stripe.api_key = os.environ.get('STRIPE_API_KEY', 'sk_test_tR3PYbcVNZZ796tH88S4VQ2u')

@checkout_bp.route('/create-session', methods=['POST'])
def create_checkout_session():
    data = request.json
    if not data or 'products' not in data or not data['products']:
        return jsonify({'error': 'No products provided'}), 400

    # Optionally, validate product IDs here

    # Simulate a payment session creation
    fake_session_id = str(uuid.uuid4())
    return jsonify({'id': fake_session_id})
