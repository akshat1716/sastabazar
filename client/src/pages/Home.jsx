import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-aura-900 to-aura-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to <span className="text-aura-300">sastabazar</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-aura-200">
              Your one-stop destination for quality products
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-white text-aura-900 px-8 py-4 rounded-lg font-semibold hover:bg-aura-100 transition-colors duration-200"
              >
                Shop Now
              </Link>
              <Link
                to="/products?category=home-goods"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-aura-900 transition-colors duration-200"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-aura-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-aura-900 mb-4">
              Why Choose sastabazar?
            </h2>
            <p className="text-lg text-aura-600">
              Quality products, great prices, and excellent service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-aura-900 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                🚚
              </div>
              <h3 className="text-xl font-semibold mb-2">Free Shipping</h3>
              <p className="text-aura-600">On orders over ₹999</p>
            </div>

            <div className="text-center">
              <div className="bg-aura-900 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                🛡️
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
              <p className="text-aura-600">100% secure transactions</p>
            </div>

            <div className="text-center">
              <div className="bg-aura-900 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                🔄
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Returns</h3>
              <p className="text-aura-600">30-day return policy</p>
            </div>

            <div className="text-center">
              <div className="bg-aura-900 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                ⭐
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
              <p className="text-aura-600">Curated selection</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-aura-900 mb-4">
            Ready to Shop?
          </h2>
          <p className="text-lg text-aura-600 mb-8">
            Discover our amazing collection of products
          </p>
          <Link
            to="/products"
            className="bg-aura-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-aura-800 transition-colors duration-200"
          >
            View All Products
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
