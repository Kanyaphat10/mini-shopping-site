import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CheckoutPage from './CheckoutPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
  }),
}));

const mockClear = vi.fn();

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
    getTotalPrice: () => 40.00,
    clear: mockClear,
  }),
}));

const mockOrderCreate = vi.fn();

vi.mock('../services/api', () => ({
  orderService: {
    create: (...args: any[]) => mockOrderCreate(...args),
  },
}));

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders checkout form and submits successfully', async () => {
    mockOrderCreate.mockResolvedValue({ data: { id: 'order-123' } });

    render(
      <BrowserRouter>
        <CheckoutPage />
      </BrowserRouter>
    );

    const addressInput = screen.getByPlaceholderText(/Enter your complete shipping address/i);
    fireEvent.change(addressInput, { target: { value: '123 Test Street Ave' } });

    const submitButton = screen.getByRole('button', { name: /Place Order/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOrderCreate).toHaveBeenCalledWith('123 Test Street Ave');
      expect(mockClear).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });
  });

  it('displays out of stock error from backend', async () => {
    mockOrderCreate.mockResolvedValue({ data: { error: 'Product Test Product is out of stock' } });

    render(
      <BrowserRouter>
        <CheckoutPage />
      </BrowserRouter>
    );

    const addressInput = screen.getByPlaceholderText(/Enter your complete shipping address/i);
    fireEvent.change(addressInput, { target: { value: '123 Test Street Ave' } });

    const submitButton = screen.getByRole('button', { name: /Place Order/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Product Test Product is out of stock')).toBeDefined();
    });
  });
});
