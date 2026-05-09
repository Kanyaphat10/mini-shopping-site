import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function AuthSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [error, setError] = useState('')

  useEffect(() => {
    const handleAuthSuccess = async () => {
      const token = searchParams.get('token')
      const sessionToken = searchParams.get('sessionToken')

      if (!token || !sessionToken) {
        setError('Invalid authentication data received.')
        return
      }

      try {
        // Temporarily set tokens in localStorage so api interceptor picks them up
        localStorage.setItem('token', token)
        localStorage.setItem('sessionToken', sessionToken)

        // Validate session to get user details
        const response = await authService.validateSession()
        
        if (response.data.valid && response.data.user) {
          login(response.data.user, token, sessionToken)
          navigate('/')
        } else {
          setError('Failed to validate session.')
          localStorage.removeItem('token')
          localStorage.removeItem('sessionToken')
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Authentication verification failed.')
        localStorage.removeItem('token')
        localStorage.removeItem('sessionToken')
      }
    }

    handleAuthSuccess()
  }, [searchParams, navigate, login])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Authentication Failed</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
