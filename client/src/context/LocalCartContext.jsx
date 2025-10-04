import { createContext, useContext, useState, useEffect } from 'react'

const LocalCartContext = createContext()

export const useLocalCart = () => {
  const context = useContext(LocalCartContext)
  if (!context) {
    throw new Error('useLocalCart must be used within a LocalCartProvider')
  }
  return context
}

export const LocalCartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    items: [],
    totalPrice: 0
  })
  const [notification, setNotification] = useState(null)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('sastabazar-cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sastabazar-cart', JSON.stringify(cart))
  }, [cart])

  const calculateTotal = (items) => {
    return items.reduce((total, item) => {
      const price = item.selectedVariant?.price || item.productId?.basePrice || 0
      return total + (price * item.quantity)
    }, 0)
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  const addToCart = (productId, quantity = 1, variant = null) => {
    console.log('LocalCartContext addToCart called with:', { productId, quantity, variant })
    setCart(prevCart => {
      const existingItem = prevCart.items.find(item => 
        item.productId._id === productId._id && 
        JSON.stringify(item.selectedVariant) === JSON.stringify(variant)
      )

      let newItems
      if (existingItem) {
        newItems = prevCart.items.map(item =>
          item._id === existingItem._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        showNotification(`Updated ${productId.name} quantity in cart!`)
      } else {
        const newItem = {
          _id: `item_${Date.now()}_${Math.random()}`,
          productId,
          quantity,
          selectedVariant: variant
        }
        newItems = [...prevCart.items, newItem]
        showNotification(`${productId.name} added to cart!`)
      }

      return {
        items: newItems,
        totalPrice: calculateTotal(newItems)
      }
    })
  }

  const updateCartItem = (itemId, quantity) => {
    setCart(prevCart => {
      const newItems = prevCart.items.map(item =>
        item._id === itemId ? { ...item, quantity } : item
      ).filter(item => item.quantity > 0)

      return {
        items: newItems,
        totalPrice: calculateTotal(newItems)
      }
    })
  }

  const removeFromCart = (itemId) => {
    setCart(prevCart => {
      const newItems = prevCart.items.filter(item => item._id !== itemId)
      return {
        items: newItems,
        totalPrice: calculateTotal(newItems)
      }
    })
  }

  const clearCart = () => {
    setCart({
      items: [],
      totalPrice: 0
    })
  }

  const value = {
    cart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    isLoading: false,
    notification,
    showNotification
  }

  return (
    <LocalCartContext.Provider value={value}>
      {children}
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {notification.message}
          </div>
        </div>
      )}
    </LocalCartContext.Provider>
  )
}
