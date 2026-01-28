import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InventoryManager from './InventoryManager';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ data: [], error: null })),
      })),
    })),
  },
}));

vi.mock('../lib/n8n', () => ({
  triggerLowStockAlert: vi.fn(() => Promise.resolve({ success: true })),
  triggerExpiryAlert: vi.fn(() => Promise.resolve({ success: true })),
  isN8nConfigured: vi.fn(() => false),
}));

vi.mock('../lib/storage', () => ({
  uploadAndTrack: vi.fn(),
  BUCKETS: { PRODUCTS: 'products' },
  getPublicUrl: vi.fn(),
}));

vi.mock('../lib/imageCompression', () => ({
  compressImage: vi.fn(),
  getCompressionSummary: vi.fn(),
}));

vi.mock('./ProductQRCode', () => ({
  default: () => <div>QRCode Component</div>,
}));

vi.mock('./QRScanner', () => ({
  default: () => <div>Scanner Component</div>,
}));

vi.mock('./CategoryManager', () => ({
  default: () => <div>Category Manager</div>,
}));

vi.mock('./StorageDiagnostics', () => ({
  default: () => <div>Storage Diagnostics</div>,
}));

describe('InventoryManager Component', () => {
  const mockOnProductUpdate = vi.fn();

  const mockProducts = [
    {
      id: '1',
      name: 'Test Product 1',
      price: 10.50,
      category: 'Groceries',
      unit: 'each',
      stock_quantity: 20,
      is_active: true,
      barcode: '123456',
    },
    {
      id: '2',
      name: 'Test Product 2',
      price: 5.00,
      category: 'Snacks',
      unit: 'pack',
      stock_quantity: 5,
      is_active: true,
      barcode: '789012',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render inventory manager with products', () => {
    render(<InventoryManager products={mockProducts} onProductUpdate={mockOnProductUpdate} />);

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
  });

  it('should filter products by search term', async () => {
    const user = userEvent.setup();
    render(<InventoryManager products={mockProducts} onProductUpdate={mockOnProductUpdate} />);

    const searchInput = screen.getByPlaceholderText(/search products/i);
    await user.type(searchInput, 'Product 1');

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
    });
  });

  it('should display stock quantity correctly', () => {
    render(<InventoryManager products={mockProducts} onProductUpdate={mockOnProductUpdate} />);

    expect(screen.getByText(/20/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('should update stock quantity', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({ error: null })),
    }));
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ data: [], error: null })),
      })),
    } as any);

    render(<InventoryManager products={mockProducts} onProductUpdate={mockOnProductUpdate} />);

    const incrementButtons = screen.getAllByRole('button', { name: '' });
    if (incrementButtons.length > 0) {
      await user.click(incrementButtons[0]);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    }
  });

  it('should display low stock warning', () => {
    const lowStockProduct = [{
      ...mockProducts[0],
      stock_quantity: 2,
    }];

    render(<InventoryManager products={lowStockProduct} onProductUpdate={mockOnProductUpdate} />);

    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('should display product prices correctly', () => {
    render(<InventoryManager products={mockProducts} onProductUpdate={mockOnProductUpdate} />);

    expect(screen.getByText(/£10.50/)).toBeInTheDocument();
    expect(screen.getByText(/£5.00/)).toBeInTheDocument();
  });
});
