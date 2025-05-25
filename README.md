# ShopSmarter Documentation

## Project Overview
This is an AI-powered e-commerce application named "ShopSmarter." It leverages advanced AI models for image analysis, product recommendations, and user personalization. The application consists of a backend built with Flask and a frontend built with React.

## Tech Stack
- **Backend:** Flask (Python 3.13.3)
- **Frontend:** React
- **Database:** SQLite (for development)
- **AI Models:** Google Gemini API, OpenAI CLIP, FAISS
- **Dependencies:** Listed in `requirements.txt` for the backend and `package.json` for the frontend.

## Setup Instructions

### 1. Installing Git
```bash
sudo apt install git
```

### 2. Cloning the Repository
```bash
git clone https://github.com/SaiGane5/shopsmarter.git
cd shopsmarter/
```

### 3. Setting Up the Backend
- Navigate to the backend directory:
```bash
cd backend/
```

- **Creating the Virtual Environment:**
Ensure you have Python 3.13.3. If not, install `pyenv`:
```bash
sudo apt update
sudo apt install -y make build-essential libssl-dev zlib1g-dev \
libbz2-dev libreadline-dev libsqlite3-dev curl git \
llvm libncursesw5-dev xz-utils tk-dev libxml2-dev \
libxmlsec1-dev libffi-dev liblzma-dev
git clone https://github.com/pyenv/pyenv.git ~/.pyenv
```

Add the following to your `~/.bashrc`:
```bash
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init --path)"
eval "$(pyenv init -)"
```

Source the updated `.bashrc`:
```bash
source ~/.bashrc
```

Install Python 3.13.3:
```bash
pyenv install 3.13.3
pyenv global 3.13.3
```

Install the virtual environment package:
```bash
sudo apt install python3.11-venv
python3 -m venv .venv
```

- **Activating the Virtual Environment:**
```bash
source .venv/bin/activate
```

- **Installing Dependencies:**
```bash
pip install -r requirements.txt
pip install datasets
```

- **Loading Data:**
```bash
python3 -m services.load_data
```

### 4. Basic Backend Setup Done.

### 5. Setting Up the Frontend
- Navigate to the frontend directory:
```bash
cd ..
cd frontend
```

- Install frontend dependencies:
```bash
npm install
```

- Start the frontend application:
```bash
npm start
```

### 6. Running the Backend
- Start the backend server:
```bash
python3 app.py
```

## Project Structure
- **backend/**
  - `app.py`: Main Flask application file that initializes the app and registers routes.
  - `.env`: Environment variables for configuration.
  - `.gitignore`: Specifies files to ignore in version control.
  - `app.log`: Log file for application logs.
  - `README.md`: Documentation for the backend.
  - `requirements.txt`: List of Python dependencies.
  - **data/**
    - `load_data.py`: Script for loading and processing data.
  - **database/**
    - `models.py`: Database models for User, Product, etc.
  - **routes/**
    - `image_analysis.py`: Routes for image analysis.
    - `recommendation.py`: Routes for product recommendations.
    - `products.py`: Routes for product management.
    - `user.py`: Routes for user management.
    - `checkout.py`: Routes for checkout processing.
  - **services/**
    - `clip_model.py`: Service for handling CLIP model interactions.
    - `embedding_service.py`: Service for generating embeddings.
    - `vector_search.py`: Service for vector similarity search.
    - `nlp_agent.py`: Service for NLP-based refinements.
    - `load_data.py`: Data loading service.
  - **static/**
    - **images/**: Directory for storing product images.
  - **uploads/**: Directory for temporary uploads.
  - **utils/**
    - `preprocess.py`: Utility functions for preprocessing data.

- **frontend/**
  - `.env`: Environment variables for frontend configuration.
  - `.gitignore`: Specifies files to ignore in version control.
  - `package.json`: Lists frontend dependencies and scripts.
  - `postcss.config.js`: Configuration for PostCSS.
  - `README.md`: Documentation for the frontend.
  - `tailwind.config.js`: Configuration for Tailwind CSS.
  - **public/**
    - `index.html`: Main HTML file for the frontend application.
  - **src/**: Source directory for frontend components and logic.

## Common Issues and Resolutions
- **FAISS errors:** Try `pip install faiss-cpu`.
- **RAM spikes:** Reduce batch sizes in embedding generation.
- **Missing images:** Confirm presence in `static/images/`.
- **Invalid API keys:** Ensure `.env` is correctly populated.

This documentation provides a comprehensive guide to setting up and running the ShopSmarter application, including the necessary steps for both the backend and frontend components.