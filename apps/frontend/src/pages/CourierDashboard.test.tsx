import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CourierDashboard from './CourierDashboard';

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
    user: { id: 'courier-123', email: 'courier@example.com', name: 'Courier', role: 'COURIER' },
  }),
}));

const mockShipments = [
  {
    id: 'shipment-1',
    status: 'PENDING',
    order: {
      id: 'order-1',
      shippingAddr: '123 Fake St',
      user: { name: 'Test User' },
    },
  },
  {
    id: 'shipment-2',
    status: 'IN_TRANSIT',
    trackingNumber: 'TRK123',
    order: {
      id: 'order-2',
      shippingAddr: '456 Real Ave',
      user: { name: 'Another User' },
    },
  },
];

const mockGetCourierShipments = vi.fn().mockResolvedValue({ data: mockShipments });
const mockUpdateShipment = vi.fn().mockResolvedValue({ data: { success: true } });

vi.mock('../services/api', () => ({
  shipmentService: {
    getCourierShipments: (...args: any[]) => mockGetCourierShipments(...args),
    update: (...args: any[]) => mockUpdateShipment(...args),
  },
}));

describe('CourierDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders shipments and filters them', async () => {
    render(
      <BrowserRouter>
        <CourierDashboard />
      </BrowserRouter>
    );

    // Initial load
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeDefined();
      expect(screen.getByText('Another User')).toBeDefined();
    });

    // Stats
    expect(screen.getByText('2')).toBeDefined(); // Total

    // Click filter IN_TRANSIT
    const inTransitFilter = screen.getByRole('button', { name: /IN TRANSIT/i });
    fireEvent.click(inTransitFilter);

    // Only 'Another User' should be visible
    expect(screen.queryByText('Test User')).toBeNull();
    expect(screen.getByText('Another User')).toBeDefined();
  });

  it('opens update modal and submits update', async () => {
    render(
      <BrowserRouter>
        <CourierDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeDefined();
    });

    // Click first Update Status button
    const updateButtons = screen.getAllByRole('button', { name: /Update Status/i });
    fireEvent.click(updateButtons[0]);

    // Modal should appear
    expect(screen.getByText('Update Shipment')).toBeDefined();

    // Change status
    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'PICKED_UP' } });

    // Submit
    const form = screen.getByRole('button', { name: /Save Changes/i }).closest('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockUpdateShipment).toHaveBeenCalledWith('shipment-1', expect.objectContaining({
        status: 'PICKED_UP',
      }));
    });
    
    await waitFor(() => {
      // Modal should disappear on success
      expect(screen.queryByText('Update Shipment')).toBeNull();
    });
  });
});
