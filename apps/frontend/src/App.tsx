import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Header from './components/Header'
import Footer from './components/Footer'
import { ThemeProvider } from "./components/ThemeProvider"
import { Toaster } from 'sonner'

// Pages
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import LoginPage from './pages/LoginPage'
import StaffLoginPage from './pages/StaffLoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthSuccessPage from './pages/AuthSuccessPage'
import CourierDashboard from './pages/CourierDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ServiceDashboard from './pages/ServiceDashboard'
import ProfilePage from './pages/ProfilePage'
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
    <ThemeProvider>
      <Toaster position="top-center" richColors />
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
                path="/staff/login"
                element={user ? <Navigate to="/" /> : <StaffLoginPage />}
              />
              <Route
                path="/register"
                element={user ? <Navigate to="/" /> : <RegisterPage />}
              />
              <Route
                path="/auth/success"
                element={<AuthSuccessPage />}
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

              {/* Protected service agent routes */}
              {user?.role === 'SERVICE_AGENT' && (
                <Route path="/service" element={<ServiceDashboard />} />
              )}

              {/* Protected profile route for all users */}
              {user && (
                <Route path="/profile" element={<ProfilePage />} />
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
    </ThemeProvider>
  )
}

export default App
