import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export default function StaffLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    setLoading(true)

    try {
      const response = await authService.login(data.email, data.password)
      const user = response.data.user
      
      if (!['ADMIN', 'COURIER', 'SERVICE_AGENT'].includes(user.role)) {
        setError('Access denied. Staff members only.')
        setLoading(false)
        return
      }

      login(user, response.data.token, response.data.sessionToken)
      
      // Redirect based on role
      if (user.role === 'ADMIN') navigate('/admin')
      else if (user.role === 'COURIER') navigate('/courier')
      else navigate('/') // service agent dashboard not yet implemented fully

    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border shadow-lg p-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Staff Portal</h1>
            <p className="text-muted-foreground">Sign in to access your dashboard</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Staff Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="staff@minishop.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Password</label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
