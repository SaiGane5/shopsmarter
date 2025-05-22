# Shop Smarter: Visual Fashion Search Application

Shop Smarter is a full-stack application that allows users to search for fashion products using images. The application uses computer vision and machine learning to analyze uploaded images and recommend similar products.

## Features

- **Visual Search**: Upload images to find similar fashion products
- **Product Recommendations**: Get personalized product recommendations based on visual features
- **Shopping Cart**: Add products to cart and proceed to checkout
- **User Preferences**: Save preferences for better recommendations
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- Flask (Python web framework)
- PyTorch & CLIP (for image feature extraction)
- FAISS (for efficient similarity search)
- SQLite (database)
- Google Gemini API (for image feature extraction)

### Frontend
- React (UI library)
- TailwindCSS (styling)
- Context API (state management)

## Project Setup

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn
- Git

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/SaiGane5/shop-smarter.git
cd shop-smarter/backend
```

2. Create and activate a virtual environment:
```bash
python -m venv .venv
# On Windows
.venv\Scripts\activate
# On macOS/Linux
source .venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Create a .env file in the backend directory
touch .env

# Add the following to the .env file
FLASK_APP=app.py
FLASK_ENV=development
GEMINI_API_KEY=your_gemini_api_key
STRIPE_API_KEY=your_stripe_api_key
```

5. Initialize the database:
```bash
flask db init
flask db migrate
flask db upgrade
```

6. Load sample data:
```bash
python -m services.load_data
```

7. Start the backend server:
```bash
flask run
```

The backend server will be running at http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
# Create a .env file in the frontend directory
touch .env

# Add the following to the .env file
REACT_APP_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

The frontend application will be running at http://localhost:3000

## Development Workflow

### Backend Development

- The backend is structured as a Flask application with blueprints for different features
- The `services` directory contains core functionality like image analysis and vector search
- The `database` directory contains database models and migration scripts

### Frontend Development

- The frontend is a React application with components, contexts, and hooks
- The `src/components` directory contains reusable UI components
- The `src/context` directory contains React context providers for state management
- The `src/pages` directory contains page components

## Troubleshooting

### FAISS Issues on macOS

If you encounter segmentation faults with FAISS on macOS:

1. Install FAISS using conda instead of pip:
```bash
conda install -c conda-forge faiss-cpu
```

2. Or use the traditional similarity search by setting the environment variable:
```bash
DISABLE_FAISS=1 flask run
```

### Image Processing Issues

If you encounter issues with image processing:

1. Make sure the `uploads` directory exists and is writable
2. Check that your Gemini API key is valid
3. Ensure that PyTorch is installed correctly

## Deployment

### Backend Deployment

1. Set up a production server (e.g., AWS EC2, Heroku)
2. Install dependencies and set environment variables
3. Use Gunicorn as the WSGI server:
```bash
gunicorn app:app
```

### Frontend Deployment

1. Build the production version:
```bash
npm run build
```

2. Deploy the built files to a static hosting service (e.g., Netlify, Vercel)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.