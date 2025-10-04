import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // For demo purposes, accept any email/password combination
      const emailPrefix = formData.email.split('@')[0]
      
      // Extract first name from email prefix
      // Handle cases like "john.doe", "john_doe", "john-doe", "johndoe123"
      let firstName = emailPrefix
        .split(/[._-]/)[0]  // Split by common separators and take first part
        .replace(/\d+/g, '')  // Remove numbers
        .toLowerCase()
      
      // Capitalize first letter
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
      
      // If empty after processing, use a default
      if (!firstName) {
        firstName = 'User'
      }
      
      const userData = {
        id: 'demo-user-123',
        name: firstName, // Use clean first name
        email: formData.email,
        isActive: true
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Set user data in localStorage
      localStorage.setItem('token', 'demo-token-123')
      localStorage.setItem('user', JSON.stringify(userData))
      
      toast.success('Login successful!')
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('userLogin', { detail: userData }))
      
      // Use navigate instead of window.location.href for better React routing
      navigate('/', { replace: true })
    } catch (error) {
      toast.error('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-aura-600 hover:text-aura-500">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-aura-500 focus:border-aura-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-aura-500 focus:border-aura-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-aura-600 hover:bg-aura-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aura-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Demo: Use any email and password to login
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Examples: john@gmail.com → "Welcome, John" | sarah.doe@yahoo.com → "Welcome, Sarah"
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('user')
                localStorage.removeItem('token')
                toast.success('Logged out successfully!')
                window.location.reload()
              }}
              className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
            >
              Clear current session and start fresh
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login