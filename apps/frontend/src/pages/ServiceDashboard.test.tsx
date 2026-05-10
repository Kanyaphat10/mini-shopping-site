import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ServiceDashboard from './ServiceDashboard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

const { mockGetAll, mockGetUserOrders, mockUpdate } = vi.hoisted(() => ({
  mockGetAll: vi.fn().mockResolvedValue({ data: [
    { id: 'u1', email: 'bob@example.com', name: 'Bob', role: 'CUSTOMER', createdAt: new Date().toISOString() },
    { id: 'u2', email: 'alice@example.com', name: 'Alice', role: 'COURIER', createdAt: new Date().toISOString() },
  ]}),
  mockGetUserOrders: vi.fn().mockResolvedValue({ data: [
    { id: 'o1', status: 'PENDING', totalPrice: '50.00', createdAt: new Date().toISOString(), items: [] },
  ]}),
  mockUpdate: vi.fn().mockResolvedValue({ data: { id: 'u1', name: 'Bob Updated', email: 'bob@example.com', role: 'CUSTOMER' } })
}));

vi.mock('../store/authStore', () => {
  let user: any = { id: 'agent-1', email: 'agent@example.com', name: 'Agent', role: 'SERVICE_AGENT' };
  return {
    useAuthStore: () => ({
      user,
    }),
    __mockUser: (newUser: any) => { user = newUser; }
  };
});

vi.mock('../services/api', () => ({
  userService: {
    getAll: (...args: any[]) => mockGetAll(...args),
    getUserOrders: (...args: any[]) => mockGetUserOrders(...args),
    update: (...args: any[]) => mockUpdate(...args),
  },
}));

import { __mockUser } from '../store/authStore';

describe('ServiceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders users list and handles search', async () => {
    render(
      <BrowserRouter>
        <ServiceDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeDefined();
      expect(screen.getByText('Alice')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(/Search by name or email/i);
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    expect(screen.queryByText('Bob')).toBeNull();
    expect(screen.getByText('Alice')).toBeDefined();
  });

  it('selects user, shows profile and orders, and allows editing', async () => {
    render(
      <BrowserRouter>
        <ServiceDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeDefined();
    });

    // Click on Bob
    fireEvent.click(screen.getByText('Bob'));

    await waitFor(() => {
      expect(mockGetUserOrders).toHaveBeenCalledWith('u1');
      expect(screen.getByText('Profile Details')).toBeDefined();
      expect(screen.getByText('Order History')).toBeDefined();
      // Order ID is sliced
      expect(screen.getByText(/#O1/i)).toBeDefined();
    });

    // Click Edit
    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));

    let nameInput: any;
    await waitFor(() => {
      nameInput = screen.getByDisplayValue('Bob');
    });
    fireEvent.change(nameInput, { target: { value: 'Bob Updated' } });

    // Save
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.submit(saveButton.closest('form')!);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('u1', expect.objectContaining({ name: 'Bob Updated' }));
      // Should exit edit mode and show updated name
      expect(screen.queryByRole('button', { name: /Save Changes/i })).toBeNull();
    });
  });
});
