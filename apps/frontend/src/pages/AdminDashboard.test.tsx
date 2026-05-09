import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';

// Mock the auth store and services
vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    user: { role: 'ADMIN', name: 'Admin User' },
  }),
}));

vi.mock('../services/api', () => ({
  adminService: {
    getStats: vi.fn().mockResolvedValue({
      data: { totalUsers: 10, totalOrders: 5, totalProducts: 20, totalRevenue: 1000 }
    }),
    getOrders: vi.fn().mockResolvedValue({
      data: []
    }),
  },
  productService: {
    getAll: vi.fn().mockResolvedValue({
      data: [
        { id: '1', sku: 'SKU-1', name: 'Prod 1', price: '10', stock: 5, productStatus: 'ACTIVE' }
      ]
    }),
  }
}));

describe('AdminDashboard', () => {
  it('renders the admin dashboard and fetches stats', async () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Initial loading state or immediate render
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeDefined();
    });

    // Check if tabs are rendered
    expect(screen.getByRole('button', { name: /overview/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /orders/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /products/i })).toBeDefined();
    
    // Check if stats are rendered
    await waitFor(() => {
      expect(screen.getByText('10')).toBeDefined(); // Total Users
      expect(screen.getByText('20')).toBeDefined(); // Total Products
    });
  });
});
