import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

const { mockSetUser, mockUpdateMe, mockGetAllOrders, mockGetUserById } = vi.hoisted(() => ({
  mockSetUser: vi.fn(),
  mockUpdateMe: vi.fn().mockResolvedValue({ data: { name: 'New Name' } }),
  mockGetAllOrders: vi.fn().mockResolvedValue({
    data: [
      {
        id: 'order-1',
        status: 'SHIPPED',
        totalPrice: '100.00',
        createdAt: new Date().toISOString(),
        items: [{ id: 'item-1', quantity: 2, product: { name: 'Item', price: '50' } }],
      },
    ],
  }),
  mockGetUserById: vi.fn().mockResolvedValue({ data: { vehicleType: 'Bicycle' } }),
}));

vi.mock('../store/authStore', () => {
  let user: any = { id: 'cust-1', email: 'cust@example.com', name: 'Customer', role: 'CUSTOMER' };
  return {
    useAuthStore: () => ({
      user,
      setUser: mockSetUser,
    }),
    __mockUser: (newUser: any) => { user = newUser; }
  };
});

vi.mock('../services/api', () => ({
  userService: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
    updateMe: (...args: any[]) => mockUpdateMe(...args),
    getById: (...args: any[]) => mockGetUserById(...args),
  },
  orderService: {
    getAll: (...args: any[]) => mockGetAllOrders(...args),
  },
}));

import { __mockUser } from '../store/authStore';

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer profile and orders', async () => {
    __mockUser({ id: 'cust-1', email: 'cust@example.com', name: 'Customer', role: 'CUSTOMER' });
    
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    // Profile fields
    await waitFor(() => {
      expect(screen.getByDisplayValue('Customer')).toBeDefined();
    });
    
    // Recent orders should render
    await waitFor(() => {
      expect(screen.getByText('Recent Orders')).toBeDefined();
      expect(screen.getByText(/Order #RDER-1/i)).toBeDefined();
      expect(screen.getByText('SHIPPED')).toBeDefined();
    });
  });

  it('renders courier profile and fetches vehicleType', async () => {
    __mockUser({ id: 'cour-1', email: 'cour@example.com', name: 'Courier', role: 'COURIER' });
    
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Bicycle')).toBeDefined();
    });

    // Recent orders should NOT be rendered
    expect(screen.queryByText('Recent Orders')).toBeNull();
  });

  it('submits profile updates successfully', async () => {
    __mockUser({ id: 'cust-1', email: 'cust@example.com', name: 'Customer', role: 'CUSTOMER' });
    
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    let nameInput: any;
    await waitFor(() => {
      nameInput = screen.getByDisplayValue('Customer');
    });
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    const saveButton = screen.getByRole('button', { name: /Update Profile/i });
    fireEvent.submit(saveButton.closest('form')!);

    await waitFor(() => {
      expect(mockUpdateMe).toHaveBeenCalledWith({ name: 'New Name' });
      expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Name' }));
      expect(screen.getByText('Profile updated successfully!')).toBeDefined();
    });
  });
});
