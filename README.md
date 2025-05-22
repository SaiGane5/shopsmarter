# ShopSmarter: Visual Fashion Search Platform

ShopSmarter is a full-stack web application that leverages computer vision, AI, and seamless payment integration to deliver a next-generation fashion shopping experience. Users can upload images to visually search for similar products, get personalized recommendations, and securely check out—all in a responsive, modern UI.

---

## Features

- **Visual Search**: Upload an image to find visually similar fashion products using AI-powered feature extraction.
- **Personalized Recommendations**: Receive tailored product suggestions based on visual features and user preferences.
- **Shopping Cart & Checkout**: Add products to a cart and complete purchases with Stripe integration.
- **User Profiles**: Save preferences for improved recommendations and a more personalized experience.
- **Responsive Design**: Mobile-first UI for seamless use on all devices.
- **Robust API**: RESTful endpoints for all core features.

---

## Tech Stack

### Backend
- **Flask** (Python web framework)
- **PyTorch & OpenAI CLIP** (image embeddings)
- **FAISS** (vector similarity search)
- **Stripe API** (secure payments)
- **Google Gemini API** (advanced image analysis)
- **Flask-SQLAlchemy** (database ORM)
- **SQLite** (default DB, easily swappable)

### Frontend
- **React** (SPA UI)
- **TailwindCSS** (utility-first styling)
- **React Context API** (state management)
- **React Router** (routing)

---

## Project Structure

```
shopsmarter/
├── backend/        # Flask backend (API, image analysis, checkout)
├── frontend/       # React frontend (UI, context, routing)
├── data/           # Product and image data files
├── scripts/        # Utility/data loading scripts (if any)
```

---

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 16+
- npm (or yarn)
- Git

---

### Backend Setup (Flask)

1. **Clone the Repository**
    ```bash
    git clone https://github.com/SaiGane5/shopsmarter.git
    cd shopsmarter/backend
    ```

2. **Create and Activate a Virtual Environment**
    ```bash
    python -m venv .venv
    # On Windows
    .venv\Scripts\activate
    # On macOS/Linux
    source .venv/bin/activate
    ```

3. **Install Python Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

4. **Configure Environment Variables**

    Create a `.env` file in the `backend` directory:
    ```
    GEMINI_API_KEY=your_gemini_api_key
    STRIPE_API_KEY=your_stripe_api_key
    ```

    Add any other environment variables required by your application.

5. **Load Product and Image Data**

    - Place all product data files (e.g., CSV or JSON with product details) and product images into the `data/` directory at the root level.
    - If you have a script for data import (e.g., `load_data.py` or similar in the `scripts/` or `backend/` folder), run it after placing files in `data/`:

      ```bash
      # Example (adjust if your script is named differently)
      python ../scripts/load_data.py
      # or
      python services/load_data.py
      ```

    - Ensure the backend has read access to these files and folders.

6. **Start the Backend Server**
    ```bash
    python app.py
    ```
    By default, the server runs at `http://localhost:8000`.

---

### Frontend Setup (React)

1. **Install Dependencies**
    ```bash
    cd ../frontend
    npm install
    ```

2. **Configure Frontend Environment**

    (Optional) Create a `.env` in the `frontend` folder to override the API URL:
    ```
    REACT_APP_API_URL=http://localhost:8000
    ```

3. **Start the React App**
    ```bash
    npm start
    ```
    The development server runs at `http://localhost:3000`.

---

## Data Loading Instructions

1. **Prepare Data Files**
    - Place all initial product data and images in the `data/` directory at the root of the repository.
    - Example file structure:
        ```
        data/
        ├── products.csv
        ├── images/
        │   ├── img001.jpg
        │   ├── img002.jpg
        │   └── ...
        ```

2. **Run Data Import Script**
    - If your backend or scripts folder includes a data loader (e.g., `load_data.py`), run:
      ```bash
      python ../scripts/load_data.py
      # or if inside backend
      python services/load_data.py
      ```
    - The script should populate your database and image index for search/recommendation features.

    > **Note:** If you need to load new data in the future, repeat these steps with updated files.

---

## Core Features – Module Documentation

### Backend (Flask)

- **Image Analysis**: Receives uploaded images, extracts embeddings using OpenAI CLIP and Gemini, and stores results.
- **Recommendations**: Returns visually similar products using FAISS and custom logic.
- **Checkout**: Integrates Stripe for secure payments.
- **User Management**: Handles user preferences and session data.
- **Blueprints**: Modular route organization (`/api/image`, `/api/recommendations`, `/api/checkout`, `/api/user`).

### Frontend (React)

- **Home Page**: Upload UI, onboarding, and feature highlights.
- **Results Page**: Displays visually similar products and recommendations.
- **Checkout Page**: Cart and payment integration.
- **Reusable Components**: Modular, maintainable UI components.
- **Context Providers**: Centralized theme and state management.

---

## Environment Variables

### Backend

- `.env` (in `/backend`)
    - `GEMINI_API_KEY`: Google Gemini API key.
    - `STRIPE_API_KEY`: Stripe secret key.

### Frontend

- `.env` (in `/frontend`)
    - `REACT_APP_API_URL`: (Optional) Override the backend API endpoint.

---

## Development & Contribution

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit and push your changes
4. Open a pull request

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Troubleshooting

- **FAISS on macOS**: Use `conda install -c conda-forge faiss-cpu` if you encounter segmentation faults.
- **API Keys**: Ensure your `.env` files are correctly set for both Gemini and Stripe.
- **Image Processing Errors**: Confirm PyTorch and CLIP are installed and configured properly.

---

## Contact

For feature requests or bugs, please open an issue on GitHub.
