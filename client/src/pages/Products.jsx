import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import api from '../utils/api'
import { useLocalCart } from '../context/LocalCartContext'

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({})
  const { addToCart } = useLocalCart()

  useEffect(() => {
    const f = Object.fromEntries([...searchParams])
    setFilters(f)
  }, [searchParams])

  const { data, isLoading, error } = useQuery(
    ['products', filters], 
    () => api.get(`/products?${new URLSearchParams(filters).toString()}`), 
    { 
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  )

  const categories = [
    { id: 'apparel', name: 'Apparel' },
    { id: 'home-goods', name: 'Home Goods' },
    { id: 'tech-accessories', name: 'Tech Accessories' },
    { id: 'art-prints', name: 'Art & Prints' }
  ]

  const handleCategoryFilter = (category) => {
    const newSearchParams = new URLSearchParams(searchParams)
    if (category) {
      newSearchParams.set('category', category)
    } else {
      newSearchParams.delete('category')
    }
    setSearchParams(newSearchParams)
  }

  const activeCategory = searchParams.get('category')

  const handleAddToCart = (product) => {
    console.log('Adding to cart:', product)
    addToCart(product, 1, null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Products</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-light text-gray-900 tracking-wide mb-6">PRODUCTS</h1>
          
          {/* Category Filters */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => handleCategoryFilter(null)}
              className={`text-sm font-medium transition-colors ${
                !activeCategory
                  ? 'text-gray-900 border-b border-gray-900 pb-1'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              ALL PRODUCTS
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryFilter(category.id)}
                className={`text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'text-gray-900 border-b border-gray-900 pb-1'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {category.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      {data?.products && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-gray-500">
            {data.products.length} PRODUCT{data.products.length !== 1 ? 'S' : ''}
            {activeCategory && ` IN ${categories.find(c => c.id === activeCategory)?.name.toUpperCase()}`}
          </p>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {data?.products?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {data.products.map((product) => (
              <div key={product._id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={product.images?.[0]?.url || 'https://via.placeholder.com/300x300?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                <div className="flex items-center justify-between">
                  <div>
                    {product.isOnSale ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">₹{product.salePrice}</span>
                        <span className="text-xs text-gray-500 line-through">₹{product.basePrice}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">₹{product.basePrice}</span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="px-3 py-1 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors text-xs font-medium"
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => setSearchParams({})}
              className="px-6 py-2 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors text-sm font-medium"
            >
              CLEAR FILTERS
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Products