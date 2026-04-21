import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
})

// Add token and session to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const sessionToken = localStorage.getItem('sessionToken')
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (sessionToken) {
    config.headers['x-session-token'] = sessionToken
  }
  return config
})

export const authService = {
  register: (email: string, password: string, name: string) =>
    apiClient.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  getMe: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
  googleCallback: (email: string, name: string, id: string) =>
    apiClient.post('/auth/google/callback', { email, name, id }),
  validateSession: () => apiClient.get('/auth/session/validate'),
}

export const productService = {
  getAll: () => apiClient.get('/products'),
  getById: (id: string) => apiClient.get(`/products/${id}`),
  create: (data: any) => apiClient.post('/products', data),
  update: (id: string, data: any) => apiClient.put(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/products/${id}`),
}

export const cartService = {
  get: () => apiClient.get('/cart'),
  addItem: (productId: string, quantity: number) =>
    apiClient.post('/cart/add', { productId, quantity }),
  removeItem: (itemId: string) => apiClient.delete(`/cart/item/${itemId}`),
  clear: () => apiClient.post('/cart/clear'),
}

export const orderService = {
  getAll: () => apiClient.get('/orders'),
  getById: (id: string) => apiClient.get(`/orders/${id}`),
  create: (shippingAddr: string) =>
    apiClient.post('/orders/create', { shippingAddr }),
  updateStatus: (id: string, status: string) =>
    apiClient.put(`/orders/${id}/status`, { status }),
}

export const shipmentService = {
  getAll: () => apiClient.get('/shipments'),
  getById: (id: string) => apiClient.get(`/shipments/${id}`),
  assign: (orderId: string, courierId: string) =>
    apiClient.post(`/shipments/${orderId}/assign`, { courierId }),
  update: (id: string, data: any) => apiClient.put(`/shipments/${id}`, data),
  getCourierShipments: (courierId: string) =>
    apiClient.get(`/shipments/courier/${courierId}`),
}

export const adminService = {
  getUsers: () => apiClient.get('/admin/users'),
  getOrders: () => apiClient.get('/admin/orders'),
  getStats: () => apiClient.get('/admin/stats'),
  seedDatabase: () => apiClient.post('/admin/seed'),
}

export default apiClient
