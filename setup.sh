#!/bin/bash

echo "🚀 Setting up Aura E-commerce Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB or use MongoDB Atlas."
    echo "   You can download MongoDB from: https://www.mongodb.com/try/download/community"
fi

echo "📦 Installing backend dependencies..."
npm install

echo "📦 Installing frontend dependencies..."
cd client && npm install && cd ..

echo "🔧 Creating environment file..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Environment file created. Please edit .env with your configuration."
else
    echo "✅ Environment file already exists."
fi

echo "🎨 Setting up database..."
echo "   Please ensure MongoDB is running and update the MONGODB_URI in your .env file."

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your MongoDB URI and JWT secret"
echo "2. Start MongoDB (if running locally)"
echo "3. Run 'npm run dev' to start both frontend and backend"
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "🎯 Features included:"
echo "• Complete MERN stack e-commerce platform"
echo "• AI-powered shopping assistant chatbot"
echo "• Visual search functionality"
echo "• Personalized product recommendations"
echo "• Responsive design with minimalist aesthetic"
echo "• User authentication and cart management"
echo "• Product catalog with filtering and search"
echo ""
echo "🌟 Enjoy building with Aura!" 