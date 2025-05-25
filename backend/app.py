from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv

from routes.image_analysis import image_analysis_bp
from routes.recommendation import recommendation_bp
from routes.checkout import checkout_bp
from routes.user import user_bp
from routes.products import products_bp  # Add this import
from database.models import init_db

# Set tokenizers parallelism to avoid warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Add a route to serve static files
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# Register blueprints
app.register_blueprint(image_analysis_bp, url_prefix='/api/image')
app.register_blueprint(recommendation_bp, url_prefix='/api/recommendations')
app.register_blueprint(checkout_bp, url_prefix='/api/checkout')
app.register_blueprint(user_bp, url_prefix='/api/user')
app.register_blueprint(products_bp, url_prefix='/api/products')  # Add this line

# Initialize database
init_db(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "version": "1.0.0"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
