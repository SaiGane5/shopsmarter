# ShopSmarter Backend

A Flask-based backend for the ShopSmarter AI-powered e-commerce platform. This backend supports image-based and text-based product search, recommendations, and checkout, leveraging state-of-the-art AI models and a curated fashion dataset.

---

## 🚀 Features

- **Image Analysis:** Upload images and extract visual features using Google's Gemini API and OpenAI CLIP.
- **Product Recommendations:** AI-powered recommendations using CLIP embeddings and FAISS vector search.
- **Clothing Matching:** Intelligent outfit coordination suggestions.
- **User Personalization:** Tailored suggestions based on user history.
- **RESTful API:** Full-featured API for frontend integration.

---

## 📁 Project Structure

```
backend/
├── app.py                      # Main Flask app
├── database/
│   └── models.py               # User, Product, UserHistory models
├── routes/
│   ├── image_analysis.py       # Image upload & analysis
│   ├── recommendation.py       # Recommendation logic
│   ├── products.py             # Product search/catalog
│   ├── user.py                 # User account routes
│   └── checkout.py             # Payment processing
├── services/
│   ├── clip_model.py           # CLIP model for embeddings
│   ├── embedding_service.py    # Embedding + FAISS indexing
│   ├── vector_search.py        # Vector similarity logic
│   └── nlp_agent.py            # NLP-based refinement
├── utils/
│   └── preprocess.py           # Image preprocessing
├── data/
│   ├── load_data.py            # Data processing script
│   └── shopsmarter.db          # SQLite database
├── static/
│   └── images/                 # Product images
├── uploads/                    # Temp uploads
├── requirements.txt
└── .env
```

---

## 📦 Datasets Used

- **Fashion Product Images (Small) Dataset**  
  Source: [Hugging Face Datasets](https://huggingface.co/datasets/ashraq/fashion-product-images-small)  
  - Contains product images and metadata (category, color, gender, etc.)
  - Used for populating the product catalog and training embeddings.

---

## 🤖 Models Used

- **Google Gemini API**  
  - Used for extracting visual features from uploaded images.

- **OpenAI CLIP**  
  - Used for generating image and text embeddings for similarity search and recommendations.

- **FAISS**  
  - Used for fast vector similarity search over product embeddings.

---

## 📝 Prompts Used

- **Image Analysis Prompt (Gemini):**  
  > "Analyze this image and extract the following features: 
        1. Main category (e.g., clothing, electronics, furniture, accessories, shoes, bags)
        2. Subcategory (e.g., shirt, smartphone, sofa, watch, sneakers, backpack)
        3. Colors (list 2-3 dominant colors)
        4. Patterns (if any, e.g., striped, floral, solid, geometric)
        5. Style/design attributes (e.g., casual, formal, modern, vintage, sporty)
        6. Material (if identifiable, e.g., cotton, leather, metal, plastic, wood)
        7. Brand (if visible, otherwise "unknown")
        
        Return the response as a clean JSON object with these exact keys:
        {
            "main_category": "category_name",
            "subcategory": "subcategory_name", 
            "colors": ["color1", "color2"],
            "patterns": ["pattern1"],
            "style": ["style1", "style2"],
            "material": "material_name",
            "brand": "brand_name"
        }
      """

- **Recommendation Prompt:**  
  > """I have a list of product recommendations:
        {products}
        
        The user has provided the following prompt to refine these results:
        "{prompt}"
        
        Based on this prompt, filter and reorder the products to best match the user's request.
        Return only the product IDs in order of relevance as a JSON array.
        """

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/SaiGane5/shopsmarter/
cd shop-smarter/backend
```

### 2. Create and Activate a Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

Create a `.env` file in the backend root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
STRIPE_API_KEY=your_stripe_api_key_here
```

### 5. Load and Process the Dataset

This will download the dataset, process images, populate the database, and generate embeddings:

```bash
python data/load_data.py
```

### 6. Run the Backend Server

```bash
python app.py
```

The backend will be available at [http://localhost:8000](http://localhost:8000).

---

## 📡 API Endpoints

### 🔍 Image Analysis

- `POST /api/image/upload` — Upload image for feature extraction

### 🛒 Products

- `GET /api/products/search?q=<query>` — Search products
- `GET /api/products/latest` — Get latest products
- `GET /api/products/trending` — Get trending products
- `GET /api/products/categories` — Get product categories
- `GET /api/products/recommendations/<user_id>` — Get user-specific recommendations

### 🤖 Recommendations

- `POST /api/recommendations/similar` — Find visually similar products
- `POST /api/recommendations/refine` — Refine results using NLP prompt
- `GET /api/recommendations/status` — Get system status

### 👤 User Management

- `POST /api/user/register` — Register new user
- `GET /api/user/preferences/<user_id>` — View preferences
- `PUT /api/user/preferences/<user_id>` — Update preferences
- `GET /api/user/history/<user_id>` — View interaction history

### 💳 Checkout

- `POST /api/checkout/create-session` — Initiate Stripe payment session

---

## 🧪 Troubleshooting & Tips

- **FAISS errors:** Try `pip install faiss-cpu`
- **RAM spikes:** Reduce batch sizes in embedding generation
- **Missing images:** Confirm presence in `static/images/`
- **Invalid API keys:** Ensure `.env` is correctly populated

---

## 🛠️ Development Notes

- SQLite used for dev — easily replaceable with PostgreSQL
- Images served from `/static/images/`
- CLIP provides consistent 512-dim vectors
- Error handling + fallback logic implemented
- Logs interaction data for smarter UX

---

## 📚 References

- [Fashion Product Images Dataset on Hugging Face](https://huggingface.co/datasets/ashraq/fashion-product-images-small)
- [OpenAI CLIP](https://github.com/openai/CLIP)
- [Google Gemini API](https://ai.google.dev/)
- [FAISS](https://github.com/facebookresearch/faiss)