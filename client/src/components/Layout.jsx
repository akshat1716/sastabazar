import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocalCart } from "../context/LocalCartContext";
import { useState, useEffect } from "react";

const Layout = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useLocalCart();
  const [localUser, setLocalUser] = useState(null);

  // Check localStorage for user data
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setLocalUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
      }
    }
  }, []);

  // Listen for storage changes and custom login events
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setLocalUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error parsing stored user:", error);
        }
      } else {
        setLocalUser(null);
      }
    };

    const handleUserLogin = (event) => {
      setLocalUser(event.detail);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userLogin", handleUserLogin);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userLogin", handleUserLogin);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    logout();
    setLocalUser(null);
  };

  // Use local user if available, otherwise use context user
  const currentUser = localUser || user;
  const isLoggedIn = !!currentUser || isAuthenticated;

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/logo-mark.jpeg"
                alt="sastabazar"
                className="h-12 w-12 object-contain"
              />
              <span className="text-2xl font-bold text-aura-900">
                sastabazar
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/"
                className="text-aura-600 hover:text-aura-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                to="/products"
                className="text-aura-600 hover:text-aura-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Products
              </Link>
              <Link
                to="/cart"
                className="text-aura-600 hover:text-aura-900 px-3 py-2 rounded-md text-sm font-medium relative"
              >
                Cart
                {cart?.items?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.items.length}
                  </span>
                )}
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <span className="text-aura-600 text-sm">
                    Welcome,{" "}
                    <span className="font-semibold text-aura-900">
                      {currentUser?.name || "User"}
                    </span>
                  </span>
                  <Link
                    to="/profile"
                    className="text-aura-600 hover:text-aura-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-aura-600 hover:text-aura-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-aura-600 hover:text-aura-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-aura-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-aura-800"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">{children}</main>

      {/* Simple Footer */}
      <footer className="bg-aura-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">sastabazar</h3>
            <p className="text-aura-300">
              Your one-stop destination for quality products
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
