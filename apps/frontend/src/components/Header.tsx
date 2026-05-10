import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { ShoppingCart, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import { authService } from '../services/api'
import { Sun, Moon } from "lucide-react"
import { useTheme } from "./ThemeProvider"

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuthStore()
  const { items } = useCartStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout request failed:', error)
    }
    logout()
    navigate('/')
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            MiniShop
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex gap-6 items-center">
            <Link
              to="/products"
              className="text-foreground hover:text-primary transition"
            >
              Products
            </Link>
            {/* Dark mode toggle — Mobile */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-foreground hover:text-primary transition"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            {!user && (
              <>
                <Link
                  to="/login"
                  className="text-foreground hover:text-primary transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition"
                >
                  Register
                </Link>
              </>
            )}

            {user && (
              <>
                {user.role === "CUSTOMER" && (
                  <>
                    <Link
                      to="/cart"
                      className="flex items-center gap-2 hover:text-primary transition"
                    >
                      <ShoppingCart size={20} />
                      <span>{items.length}</span>
                    </Link>
                    <Link
                      to="/orders"
                      className="text-foreground hover:text-primary transition"
                    >
                      Orders
                    </Link>
                  </>
                )}

                {user.role === "COURIER" && (
                  <Link
                    to="/courier"
                    className="text-foreground hover:text-primary transition"
                  >
                    Dashboard
                  </Link>
                )}

                {user.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    className="text-foreground hover:text-primary transition"
                  >
                    Admin
                  </Link>
                )}

                {user.role === "SERVICE_AGENT" && (
                  <Link
                    to="/service"
                    className="text-foreground hover:text-primary transition"
                  >
                    Dashboard
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="text-foreground hover:text-primary transition"
                >
                  Profile
                </Link>

                <div className="flex items-center gap-3 pl-4 border-l border-border">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium">
                    {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-destructive hover:opacity-80 transition"
                  >
                    {/* Dark mode toggle — Desktop */}
                    <button
                      onClick={toggleTheme}
                      className="text-foreground hover:text-primary transition"
                    >
                      {theme === "dark" ? (
                        <Sun size={20} />
                      ) : (
                        <Moon size={20} />
                      )}
                    </button>
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 flex flex-col gap-4 border-t border-border pt-4">
            <Link
              to="/products"
              className="text-foreground hover:text-primary transition"
            >
              Products
            </Link>
            {/* Dark mode toggle — Mobile */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-foreground hover:text-primary transition"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            {!user && (
              <>
                <Link
                  to="/login"
                  className="text-foreground hover:text-primary transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition text-center"
                >
                  Register
                </Link>
              </>
            )}

            {user && (
              <>
                {user.role === "CUSTOMER" && (
                  <>
                    <Link
                      to="/cart"
                      className="flex items-center gap-2 hover:text-primary transition"
                    >
                      <ShoppingCart size={20} />
                      <span>Cart ({items.length})</span>
                    </Link>
                    <Link
                      to="/orders"
                      className="text-foreground hover:text-primary transition"
                    >
                      Orders
                    </Link>
                  </>
                )}

                {user.role === "COURIER" && (
                  <Link
                    to="/courier"
                    className="text-foreground hover:text-primary transition"
                  >
                    Dashboard
                  </Link>
                )}

                {user.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    className="text-foreground hover:text-primary transition"
                  >
                    Admin
                  </Link>
                )}

                {user.role === "SERVICE_AGENT" && (
                  <Link
                    to="/service"
                    className="text-foreground hover:text-primary transition"
                  >
                    Dashboard
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="text-foreground hover:text-primary transition"
                >
                  Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-destructive hover:opacity-80 transition text-left"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
