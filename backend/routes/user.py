from flask import Blueprint, request, jsonify
from database.models import db, User, UserHistory, Product

user_bp = Blueprint('user', __name__)

@user_bp.route('/register', methods=['POST'])
def register_user():
    data = request.json
    
    if not data or 'username' not in data or 'email' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'User already exists'}), 409
    
    # Create new user
    new_user = User(
        username=data['username'],
        email=data['email'],
        preferences=data.get('preferences', {})
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'message': 'User registered successfully',
        'user': new_user.to_dict()
    })

@user_bp.route('/preferences/<int:user_id>', methods=['GET', 'PUT'])
def user_preferences(user_id):
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if request.method == 'GET':
        return jsonify({'preferences': user.preferences})
    
    if request.method == 'PUT':
        data = request.json
        
        if not data or 'preferences' not in data:
            return jsonify({'error': 'No preferences provided'}), 400
        
        user.preferences = data['preferences']
        db.session.commit()
        
        return jsonify({
            'message': 'Preferences updated successfully',
            'preferences': user.preferences
        })

@user_bp.route('/history/<int:user_id>', methods=['GET'])
def user_history(user_id):
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    history_items = UserHistory.query.filter_by(user_id=user_id).order_by(UserHistory.timestamp.desc()).limit(20).all()
    
    history_with_products = []
    for item in history_items:
        product = Product.query.get(item.product_id)
        if product:
            history_with_products.append({
                'id': item.id,
                'product': product.to_dict(),
                'interaction_type': item.interaction_type,
                'timestamp': item.timestamp.isoformat()
            })
    
    return jsonify({'history': history_with_products})
