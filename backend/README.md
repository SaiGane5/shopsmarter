# **ShopSmarter Backend**

A Flask-based e-commerce recommendation system with AI-powered image analysis and product matching capabilities.

---

## 🚀 Features

* **Image Analysis**: Upload images and extract visual features using **Google's Gemini API**
* **Product Recommendations**: AI-powered recommendations using **CLIP embeddings**
* **Clothing Matching**: Intelligent outfit coordination suggestions
* **User Personalization**: Tailored suggestions based on user history
* **Vector Search**: Fast product matching using **FAISS**
* **RESTful API**: Full-featured API for frontend integration

---

## 🛠️ Technology Stack

* **Backend**: Flask, SQLAlchemy
* **Database**: SQLite
* **AI/ML**: Google Gemini API, OpenAI CLIP, FAISS
* **Image Processing**: PIL, `transformers`
* **Data**: Hugging Face datasets

---

## 📁 Project Structure

```
shopsmarter-backend/
├── app.py                      # Main Flask app
├── database/
│   └── models.py              # User, Product, UserHistory models
├── routes/
│   ├── image_analysis.py      # Image upload & analysis
│   ├── recommendation.py      # Recommendation logic
│   ├── products.py            # Product search/catalog
│   ├── user.py                # User account routes
│   └── checkout.py            # Payment processing
├── services/
│   ├── clip_model.py          # CLIP model for embeddings
│   ├── embedding_service.py   # Embedding + FAISS indexing
│   ├── vector_search.py       # Vector similarity logic
│   └── nlp_agent.py           # NLP-based refinement
├── utils/
│   └── preprocess.py          # Image preprocessing
├── data/
│   ├── load_data.py           # Data processing script
│   ├── embeddings/            # FAISS indices
│   ├── processed/             # Cleaned datasets
│   └── raw/                   # Raw datasets
├── static/
│   └── images/                # Product images
└── uploads/                   # Temp uploads
```

---

## ⚙️ Setup Instructions

### 1. **Environment Setup**

```bash
git clone <repository-url>
cd shopsmarter-backend

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install flask flask-sqlalchemy flask-cors
pip install torch torchvision transformers
pip install google-generativeai faiss-cpu
pip install datasets pandas numpy pillow tqdm
pip install python-dotenv werkzeug
```

---

### 2. **Environment Variables**

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
STRIPE_API_KEY=your_stripe_api_key_here
```

---

### 3. **Database Initialization**

The SQLite database (`shopsmarter.db`) will be auto-generated when the app runs for the first time.

---

### 4. **Data Loading**

Run:

```bash
python data/load_data.py
```

This will:

* Download the fashion dataset from Hugging Face
* Process and save images to `static/images/`
* Populate the product database
* Generate CLIP embeddings
* Create FAISS indices

---

### 5. **Run the Application**

```bash
python app.py
```

The app runs at: [http://localhost:8000](http://localhost:8000)

---

## 📡 API Endpoints

### 🔍 Image Analysis

* `POST /api/image/upload` — Upload image for feature extraction

### 🛒 Products

* `GET /api/products/search?q=<query>` — Search products
* `GET /api/products/latest` — Get latest products
* `GET /api/products/trending` — Get trending products
* `GET /api/products/categories` — Get product categories
* `GET /api/products/recommendations/<user_id>` — Get user-specific recommendations

### 🤖 Recommendations

* `POST /api/recommendations/similar` — Find visually similar products
* `POST /api/recommendations/refine` — Refine results using NLP prompt
* `GET /api/recommendations/status` — Get system status

### 👤 User Management

* `POST /api/user/register` — Register new user
* `GET /api/user/preferences/<user_id>` — View preferences
* `PUT /api/user/preferences/<user_id>` — Update preferences
* `GET /api/user/history/<user_id>` — View interaction history

### 💳 Checkout

* `POST /api/checkout/create-session` — Initiate Stripe payment session

---

## 🔍 Key Modules Explained

### 1. **Image Analysis**

* Upload image → Processed using Gemini + CLIP
* Generates visual feature vectors
* Enables similarity search via FAISS

### 2. **Product Recommendations**

* **Similar Items**: CLIP embeddings to find lookalikes
* **Clothing Matching**: Smart fashion pairings
* **Refinements**: Natural language prompts for filtering

### 3. **Personalization**

* History-based recommendations
* Trends & category suggestions with fallback

### 4. **Vector Search**

* Powered by FAISS for high-speed similarity
* Supports both visual and text-based queries

### 5. **Database Models**

* `User`: Basic profile + preferences
* `Product`: Catalog with visual/text features
* `UserHistory`: Tracks engagement for recommendations

---

## 🧪 Troubleshooting & Tips

### Common Issues

* **FAISS errors**: Try `pip install faiss-cpu`
* **RAM spikes**: Reduce batch sizes in embedding generation
* **Missing images**: Confirm presence in `static/images/`
* **Invalid API keys**: Ensure `.env` is correctly populated

### Performance Tips

* Tune batch size during CLIP embedding
* Choose optimal FAISS index based on dataset size
* Compress images for faster load times

---

## 🛠️ Development Notes

* SQLite used for dev — easily replaceable with PostgreSQL
* Images served from `/static/images/`
* CLIP provides consistent 512-dim vectors
* Error handling + fallback logic implemented
* Logs interaction data for smarter UX
