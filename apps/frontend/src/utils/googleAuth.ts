// Google OAuth Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'

interface GoogleAuthCredential {
  email: string
  name: string
  picture: string
  sub: string // Google unique ID
}

export const getGoogleAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${window.location.origin}/auth/google/callback`,
    response_type: 'token',
    scope: 'openid profile email',
    prompt: 'consent',
  })

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`
}

export const parseGoogleAuthResponse = (): GoogleAuthCredential | null => {
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)
  const accessToken = params.get('access_token')

  if (!accessToken) {
    return null
  }

  // Decode the ID token from the response if available
  // For production, you should properly validate the token
  try {
    const idToken = params.get('id_token')
    if (idToken) {
      const decoded = JSON.parse(atob(idToken.split('.')[1]))
      return {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        sub: decoded.sub,
      }
    }
  } catch (error) {
    console.error('Failed to parse Google token:', error)
  }

  return null
}

export const redirectToGoogleAuth = () => {
  window.location.href = getGoogleAuthUrl()
}
