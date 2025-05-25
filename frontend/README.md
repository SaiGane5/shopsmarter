# ShopSmarter Frontend

ShopSmarter is an AI-powered e-commerce platform that lets users discover products visually, search with natural language, and enjoy a seamless shopping experience powered by advanced AI and a modern UI.

---

## 🚀 Features

- **Landing Page**: Hero section, trending products, categories, and quick navigation.
- **Image Upload & Visual Search**: Upload images to find visually similar products using AI.
- **Smart Text Search**: Fast, AI-powered keyword search with suggestions.
- **Product Results & Recommendations**: Grid display, add-to-cart, and conversational refinement.
- **Conversational AI Assistant**: Chat interface to refine searches and get smart recommendations.
- **Cart & Checkout**: Persistent cart, Stripe-powered secure checkout, and order summary.
- **User Experience**: Responsive design, dark mode, animated backgrounds, and modern UI.

---

## 🛠️ Tech Stack

- **React**: ^18.2.0
- **Tailwind CSS**: ^3.1.8
- **PostCSS**: ^8.4.14
- **Autoprefixer**: ^10.4.7
- **Axios**: ^0.27.2
- **Node.js**: >=14.x recommended

---

## 📁 Project Structure

```
frontend/
├── .env
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── public/
│   └── index.html
└── src/
    ├── App.js
    ├── App.css
    ├── index.js
    ├── index.css
    ├── components/
    │   ├── ChatInterface.jsx
    │   ├── Footer.jsx
    │   ├── ImageUploader.jsx
    │   ├── Navbar.jsx
    │   └── ProductCard.jsx
    ├── context/
    │   └── ThemeContext.jsx
    └── pages/
        ├── About.jsx
        ├── Checkout.jsx
        ├── CheckoutCancel.jsx
        ├── CheckoutSuccess.jsx
        ├── Contact.jsx
        ├── ImageUpload.jsx
        ├── LandingPage.jsx
        ├── NotFound.jsx
        ├── Results.jsx
        └── SearchResults.jsx
```

---

## ⚡ Setup Instructions

### 1. Clone the Repository

```bash
sudo apt install git
git clone https://github.com/SaiGane5/shopsmarter.git
cd shopsmarter/frontend
```

### 2. Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```
GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_API_URL=http://localhost:8000/api
STRIPE_API_KEY=your_stripe_api_key_here
NODE_ENV=development
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Frontend

```bash
npm start
```

The app will run at [http://localhost:3000](http://localhost:3000).

---

## 🧩 Common Issues & Solutions

- **Missing dependencies**:  
  Run `npm install` to ensure all packages are installed.

- **Build errors**:  
  Check for syntax errors in your React components.

- **API connection issues**:  
  Ensure the backend server is running and accessible at the URL in your `.env` (`REACT_APP_API_URL`).

- **Environment variable issues**:  
  Make sure your `.env` file is present and correctly configured.

- **CORS errors**:  
  The backend must have CORS enabled for `/api/*` endpoints.

- **Image upload fails**:  
  Check backend `/api/image/upload` endpoint and file type restrictions.

---

## 💡 Professional Tips

- Use `ThemeContext.jsx` to manage dark mode across the app.
- All API endpoints are prefixed with `/api/` and configured via `.env`.
- For production, build the frontend with `npm run build` and serve with a static server or integrate with the backend.
- Keep your dependencies up to date and review `package.json` for version compatibility.
