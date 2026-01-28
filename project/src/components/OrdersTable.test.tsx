import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrdersTable from './OrdersTable';
import { supabase } from '../lib/supabase';
import type { Order } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
  },
}));

vi.mock('../lib/n8n', () => ({
  triggerOrderEmail: vi.fn(),
  isN8nConfigured: vi.fn(() => false),
}));

describe('OrdersTable Component', () => {
  const mockOnOrderUpdate = vi.fn();

  const mockOrders: Order[] = [
    {
      id: '1',
      customer_name: 'John Doe',
      phone_number: '07123456789',
      channel: 'WhatsApp',
      status: 'Pending',
      total: 25.50,
      delivery_fee: 3.50,
      delivery_address: '123 Test Street',
      notes: 'Ring doorbell',
      items: [
        { product_name: 'Product 1', quantity: 2, price: 10.00 },
        { product_name: 'Product 2', quantity: 1, price: 5.50 },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      business_id: 'test-business',
    },
    {
      id: '2',
      customer_name: 'Jane Smith',
      phone_number: '07987654321',
      channel: 'Web',
      status: 'Confirmed',
      total: 15.00,
      delivery_fee: 2.00,
      delivery_address: '456 Another Road',
      notes: null,
      items: [
        { product_name: 'Product 3', quantity: 3, price: 5.00 },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      business_id: 'test-business',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render orders table with orders', () => {
    render(<OrdersTable orders={mockOrders} onOrderUpdate={mockOnOrderUpdate} />);

    expect(screen.getByText("Today's Orders")).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should filter orders by status', async () => {
    const user = userEvent.setup();
    render(<OrdersTable orders={mockOrders} onOrderUpdate={mockOnOrderUpdate} />);

    await user.click(screen.getByRole('button', { name: 'Pending' }));

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('should update order status', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({ error: null })),
    }));
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    render(<OrdersTable orders={mockOrders} onOrderUpdate={mockOnOrderUpdate} />);

    const statusSelects = screen.getAllByRole('combobox');
    await user.selectOptions(statusSelects[0], 'Confirmed');

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Confirmed' })
      );
    });

    expect(mockOnOrderUpdate).toHaveBeenCalled();
  });

  it('should display total and item count correctly', () => {
    render(<OrdersTable orders={mockOrders} onOrderUpdate={mockOnOrderUpdate} />);

    expect(screen.getByText('£25.50')).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('should show no orders message when empty', () => {
    render(<OrdersTable orders={[]} onOrderUpdate={mockOnOrderUpdate} />);

    expect(screen.getByText('No orders found')).toBeInTheDocument();
  });

  it('should expand order details on click', async () => {
    const user = userEvent.setup();
    render(<OrdersTable orders={mockOrders} onOrderUpdate={mockOnOrderUpdate} />);

    const orderRow = screen.getByText('John Doe');
    await user.click(orderRow);

    await waitFor(() => {
      expect(screen.getByText('123 Test Street')).toBeInTheDocument();
      expect(screen.getByText('Ring doorbell')).toBeInTheDocument();
    });
  });

  it('should copy delivery link', async () => {
    const user = userEvent.setup();
    const mockClipboard = {
      writeText: vi.fn(),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(<OrdersTable orders={mockOrders} onOrderUpdate={mockOnOrderUpdate} />);

    const orderRow = screen.getByText('John Doe');
    await user.click(orderRow);

    const copyButton = await screen.findByText(/copy driver link/i);
    await user.click(copyButton);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalled();
    });
  });
});
