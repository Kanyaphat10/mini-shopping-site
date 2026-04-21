import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { parseGoogleAuthResponse } from '../utils/googleAuth'

export default function GoogleCallbackPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const googleAuth = parseGoogleAuthResponse()

        if (!googleAuth) {
          setError('Failed to authenticate with Google')
          setLoading(false)
          return
        }

        // Send OAuth data to backend
        const response = await authService.googleCallback(
          googleAuth.email,
          googleAuth.name,
          googleAuth.sub
        )

        if (response.data.error) {
          setError(response.data.error)
          setLoading(false)
          return
        }

        // Store auth data
        login(response.data.user, response.data.token, response.data.sessionToken)

        // Clear hash from URL
        window.history.replaceState({}, document.title, window.location.pathname)

        // Redirect to home
        navigate('/')
      } catch (err: any) {
        setError(err.response?.data?.error || 'OAuth failed')
        setLoading(false)
      }
    }

    handleGoogleCallback()
  }, [login, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Signing you in with Google...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg border border-border p-8">
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

  return null
}
