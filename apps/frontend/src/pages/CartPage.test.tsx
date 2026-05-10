import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CartPage from './CartPage';

// Mock dependencies
vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
  }),
}));

const mockUpdateQuantity = vi.fn();
const mockRemoveItem = vi.fn();
const mockSetItems = vi.fn();

vi.mock('../store/cartStore', () => ({
  useCartStore: () => ({
    items: [
      {
        id: 'cart-item-1',
        productId: 'prod-1',
        quantity: 2,
        product: { id: 'prod-1', name: 'Test Product', price: '20.00' },
      },
    ],
    setItems: mockSetItems,
    removeItem: mockRemoveItem,
    updateQuantity: mockUpdateQuantity,
    getTotalPrice: () => 40.00,
  }),
}));

vi.mock('../services/api', () => ({
  cartService: {
    get: vi.fn().mockResolvedValue({ data: { items: [] } }),
    removeItem: vi.fn().mockResolvedValue({}),
    updateQuantity: vi.fn().mockResolvedValue({}),
  },
}));

describe('CartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cart items and handles quantity updates', async () => {
    render(
      <BrowserRouter>
        <CartPage />
      </BrowserRouter>
    );

    // Should display the product name
    expect(await screen.findByText('Test Product')).toBeDefined();
    
    // Should display the quantity
    expect(screen.getByText('2')).toBeDefined();

    // Check order summary subtotal
    expect(screen.getAllByText('$40.00').length).toBeGreaterThan(0);
    
    // Check total (40 + 4 tax)
    expect(screen.getByText('$44.00')).toBeDefined();
  });
});
