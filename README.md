# sastabazar - Premium AI-Integrated E-commerce Platform

A minimalist, design-forward e-commerce platform built with the MERN stack, featuring AI-powered shopping assistance and personalized recommendations.

## 🎨 Design Philosophy

Inspired by high-fashion aesthetics, sastabazar combines clean typography, generous white space, and premium product photography to create a curated shopping experience.

## ✨ Features

### Core E-commerce
- Multi-category product catalog (Apparel, Home Goods, Tech Accessories, Art & Prints)
- Secure user authentication with JWT
- Dynamic product variant selectors
- Slide-in shopping cart
- Responsive design for all devices

### AI-Powered Features
- **AI Shopping Assistant**: Intelligent chatbot for personalized product recommendations
- **Visual Search**: Upload images to find similar products
- **Curated Recommendations**: Personalized suggestions based on browsing history

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcryptjs
- **AI Services**: Custom implementation with placeholder APIs

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd aura-ecommerce
   npm run install-all
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
aura-ecommerce/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # React context providers
│   │   └── utils/         # Utility functions
├── server/                # Node.js backend
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── controllers/      # Route controllers
│   └── utils/            # Backend utilities
└── public/               # Static assets
```

## 🎯 Key Features Implementation

### AI Shopping Assistant
- Floating chat interface
- Natural language processing for product queries
- Cross-category recommendations

### Visual Search
- Image upload functionality
- Simulated AI analysis endpoint
- Visual similarity matching

### Personalized Recommendations
- User behavior tracking
- Purchase history analysis
- Curated product suggestions

## 🔧 Configuration

### Environment Variables
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development
```

### Database Setup
The application uses MongoDB with the following collections:
- `users` - User accounts and preferences
- `products` - Product catalog with variants
- `orders` - Order history and tracking
- `carts` - Shopping cart data

## 🎨 Design System

### Color Palette
- Primary: Monochromatic (Black, White, Grey)
- Accent: Product photography colors
- Background: Pure white (#FFFFFF)
- Text: Deep black (#000000)

### Typography
- Font: Inter (Google Fonts)
- Weights: 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold)
- Sizes: Large, bold headings for impact

### Animations
- Smooth fade-ins and transitions
- Hover effects revealing product details
- Elegant slide-in cart animation

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js for security headers

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
Ensure all environment variables are properly configured for production deployment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Aura** - Where design meets intelligence in e-commerce. 