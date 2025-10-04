import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-6xl font-bold text-aura-600 mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="text-aura-600 mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary">Go Home</Link>
    </div>
  )
}

export default NotFound
