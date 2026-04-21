import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'CUSTOMER' | 'COURIER' | 'SERVICE_AGENT'
}

interface AuthState {
  user: User | null
  token: string | null
  sessionToken: string | null
  isLoading: boolean
  login: (user: User, token: string, sessionToken: string) => void
  logout: () => void
  setUser: (user: User | null) => void
  setIsLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      sessionToken: null,
      isLoading: false,
      login: (user, token, sessionToken) => {
        set({ user, token, sessionToken })
        localStorage.setItem('token', token)
        localStorage.setItem('sessionToken', sessionToken)
      },
      logout: () => {
        set({ user: null, token: null, sessionToken: null })
        localStorage.removeItem('token')
        localStorage.removeItem('sessionToken')
      },
      setUser: (user) => set({ user }),
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-store',
    }
  )
)
