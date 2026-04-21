import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Header from './components/Header'
import Footer from './components/Footer'

// Pages
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GoogleCallbackPage from './pages/GoogleCallbackPage'
import CourierDashboard from './pages/CourierDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { authService } from './services/api'

function App() {
  const { user, setUser } = useAuthStore()

  // Validate session on app load
  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await authService.validateSession()
        if (response.data.valid) {
          setUser(response.data.user)
        }
      } catch (error) {
        // Session invalid or expired, user will need to login again
        console.log('Session validation failed')
      }
    }

    if (localStorage.getItem('sessionToken')) {
      validateSession()
    }
  }, [])

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            
            {/* Auth routes */}
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" /> : <LoginPage />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/" /> : <RegisterPage />} 
            />
            <Route 
              path="/auth/google/callback" 
              element={<GoogleCallbackPage />} 
            />

            {/* Protected customer routes */}
            {user?.role === 'CUSTOMER' && (
              <>
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
              </>
            )}

            {/* Protected courier routes */}
            {user?.role === 'COURIER' && (
              <Route path="/courier" element={<CourierDashboard />} />
            )}

            {/* Protected admin routes */}
            {user?.role === 'ADMIN' && (
              <Route path="/admin" element={<AdminDashboard />} />
            )}

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
