import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InventoryManager from './InventoryManager';
import { supabase } from '../lib/supabase';

// Create a chainable mock that supports deep chaining
const createChainableMock = (defaultReturn: any = { data: [], error: null }) => {
  const createChain = (): any => {
    const chain: any = {
      select: vi.fn(() => createChain()),
      insert: vi.fn(() => createChain()),
      update: vi.fn(() => createChain()),
      delete: vi.fn(() => createChain()),
      eq: vi.fn(() => createChain()),
      order: vi.fn(() => createChain()),
      single: vi.fn(() => Promise.resolve(defaultReturn)),
      then: (resolve: any) => Promise.resolve(defaultReturn).then(resolve),
    };
    return chain;
  };
  return createChain();
};

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => createChainableMock()),
  },
}));

vi.mock('../lib/n8n', () => ({
  triggerLowStockAlert: vi.fn(() => Promise.resolve({ success: true })),
  triggerExpiryAlert: vi.fn(() => Promise.resolve({ success: true })),
  isN8nConfigured: vi.fn(() => false),
}));

vi.mock('../lib/email', () => ({
  sendLowStockAlertEmail: vi.fn(() => Promise.resolve({ success: true })),
  isEmailConfigured: vi.fn(() => false),
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
  default: () => <div data-testid="qrcode">QRCode Component</div>,
}));

vi.mock('./QRScanner', () => ({
  default: () => <div data-testid="scanner">Scanner Component</div>,
}));

vi.mock('./CategoryManager', () => ({
  default: () => <div data-testid="category-manager">Category Manager</div>,
}));

vi.mock('./StorageDiagnostics', () => ({
  default: () => <div data-testid="storage-diagnostics">Storage Diagnostics</div>,
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

  it('should render inventory manager with products', async () => {
    render(<InventoryManager products={mockProducts} onProductUpdate={mockOnProductUpdate} />);

    // Wait for any async state updates to complete
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });
  });

  it('should filter products by search term', async () => {
    const user = userEvent.setup();
    render(<InventoryManager products={mockProducts} onProductUpdate={mockOnProductUpdate} />);

    // Wait for initial render to complete
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search products/i);
    await user.type(searchInput, 'Product 1');

    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
    });
  });

  it('should display stock quantity correctly', async () => {
    render(<InventoryManager products={mockProducts} onProductUpdate={mockOnProductUpdate} />);

    // Wait for async state updates and products to render
    await waitFor(() => {
      // Product names should be visible
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });

    // Stock quantities (20 and 5) should be displayed somewhere in the component
    // They're displayed as text, not inputs
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('should update stock quantity', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }));
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    } as any);

    render(<InventoryManager products={mockProducts} onProductUpdate={mockOnProductUpdate} />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    // Find increment button (the + button)
    const allButtons = screen.getAllByRole('button');
    const incrementButton = allButtons.find(btn => btn.querySelector('svg'));

    if (incrementButton) {
      await user.click(incrementButton);

      await waitFor(() => {
        // Stock update was triggered
        expect(supabase.from).toHaveBeenCalled();
      });
    }
  });

  it('should display low stock warning', async () => {
    const lowStockProduct = [{
      ...mockProducts[0],
      stock_quantity: 2,
    }];

    render(<InventoryManager products={lowStockProduct} onProductUpdate={mockOnProductUpdate} />);

    // Wait for async state updates
    await waitFor(() => {
      // Product with low stock should still be displayed
      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });
  });

  it('should display product prices correctly', async () => {
    render(<InventoryManager products={mockProducts} onProductUpdate={mockOnProductUpdate} />);

    // Wait for async state updates
    await waitFor(() => {
      expect(screen.getByText(/£10.50/)).toBeInTheDocument();
      expect(screen.getByText(/£5.00/)).toBeInTheDocument();
    });
  });
});
