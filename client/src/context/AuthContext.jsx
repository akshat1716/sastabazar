import { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import api from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const queryClient = useQueryClient()

  // Check if user is authenticated on mount
  const { data: userData, isLoading } = useQuery(
    ['user', token],
    () => api.get('/auth/profile'),
    {
      enabled: !!token,
      retry: false,
      onError: () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      },
      onSuccess: (data) => {
        setUser(data.user)
      }
    }
  )

  const loginMutation = useMutation(
    (credentials) => api.post('/auth/login', credentials),
    {
      onSuccess: (data) => {
        const { token: newToken, user: userData } = data
        localStorage.setItem('token', newToken)
        setToken(newToken)
        setUser(userData)
        toast.success('Welcome back!')
        queryClient.invalidateQueries(['user'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Login failed')
      }
    }
  )

  const registerMutation = useMutation(
    (userData) => api.post('/auth/register', userData),
    {
      onSuccess: (data) => {
        const { token: newToken, user: userData } = data
        localStorage.setItem('token', newToken)
        setToken(newToken)
        setUser(userData)
        toast.success('Account created successfully!')
        queryClient.invalidateQueries(['user'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Registration failed')
      }
    }
  )

  const logoutMutation = useMutation(
    () => api.post('/auth/logout'),
    {
      onSuccess: () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        queryClient.clear()
        toast.success('Logged out successfully')
      },
      onError: () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        queryClient.clear()
      }
    }
  )

  const updateProfileMutation = useMutation(
    (profileData) => api.put('/auth/profile', profileData),
    {
      onSuccess: (data) => {
        setUser(data.user)
        toast.success('Profile updated successfully')
        queryClient.invalidateQueries(['user'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update profile')
      }
    }
  )

  const updatePreferencesMutation = useMutation(
    (preferences) => api.put('/auth/preferences', preferences),
    {
      onSuccess: (data) => {
        setUser(data.user)
        toast.success('Preferences updated successfully')
        queryClient.invalidateQueries(['user'])
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update preferences')
      }
    }
  )

  const addBrowsingHistoryMutation = useMutation(
    (productId) => api.post('/auth/browsing-history', { productId }),
    {
      onError: (error) => {
        console.error('Failed to add browsing history:', error)
      }
    }
  )

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    updatePreferences: updatePreferencesMutation.mutate,
    addBrowsingHistory: addBrowsingHistoryMutation.mutate,
    isLoginLoading: loginMutation.isLoading,
    isRegisterLoading: registerMutation.isLoading,
    isLogoutLoading: logoutMutation.isLoading,
    isUpdateProfileLoading: updateProfileMutation.isLoading,
    isUpdatePreferencesLoading: updatePreferencesMutation.isLoading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 