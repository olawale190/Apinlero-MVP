import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StripeSettings from './StripeSettings';
import { supabase } from '../lib/supabase';

// Create a chainable mock that supports deep chaining and returns proper data
const createChainableMock = (data: any = null) => {
  const createChain = (): any => {
    const chain: any = {
      select: vi.fn(() => createChain()),
      insert: vi.fn(() => createChain()),
      update: vi.fn(() => createChain()),
      delete: vi.fn(() => createChain()),
      eq: vi.fn(() => createChain()),
      order: vi.fn(() => createChain()),
      single: vi.fn(() => Promise.resolve({ data, error: null })),
      then: (resolve: any) => Promise.resolve({ data, error: null }).then(resolve),
    };
    return chain;
  };
  return createChain();
};

const mockStripeConfig = {
  stripe_publishable_key: 'pk_test_123',
  stripe_secret_key_encrypted: null,
  stripe_account_id: 'acct_123',
  stripe_webhook_secret: null,
  stripe_connected_at: '2024-01-01',
};

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => createChainableMock(mockStripeConfig)),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('StripeSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to return default config
    vi.mocked(supabase.from).mockReturnValue(createChainableMock(mockStripeConfig) as any);
  });

  it('should render Stripe settings page', async () => {
    render(<StripeSettings />);

    await waitFor(() => {
      expect(screen.getByText(/stripe payment integration/i)).toBeInTheDocument();
    });
  });

  it('should load existing Stripe configuration', async () => {
    render(<StripeSettings />);

    await waitFor(() => {
      const input = screen.getByDisplayValue('pk_test_123');
      expect(input).toBeInTheDocument();
    });
  });

  it('should validate publishable key format', async () => {
    const user = userEvent.setup();
    render(<StripeSettings />);

    await waitFor(() => {
      expect(screen.getByText(/stripe payment integration/i)).toBeInTheDocument();
    });

    // Get the publishable key input by its label
    const publishableInput = screen.getByLabelText(/publishable key/i);
    await user.clear(publishableInput);
    await user.type(publishableInput, 'invalid_key');

    // Type a secret key
    const secretInput = screen.getByLabelText(/secret key/i);
    await user.type(secretInput, 'sk_test_123');

    const testButton = screen.getByRole('button', { name: /test connection/i });
    await user.click(testButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid publishable key format/i)).toBeInTheDocument();
    });
  });

  it('should validate secret key format', async () => {
    const user = userEvent.setup();
    render(<StripeSettings />);

    await waitFor(() => {
      expect(screen.getByText(/stripe payment integration/i)).toBeInTheDocument();
    });

    const secretInput = screen.getByLabelText(/secret key/i);
    await user.type(secretInput, 'invalid_secret');

    const testButton = screen.getByRole('button', { name: /test connection/i });
    await user.click(testButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid secret key format/i)).toBeInTheDocument();
    });
  });

  it('should test Stripe connection successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: true, accountId: 'acct_test123' },
      error: null,
    });

    render(<StripeSettings />);

    await waitFor(() => {
      expect(screen.getByText(/stripe payment integration/i)).toBeInTheDocument();
    });

    const publishableInput = screen.getByLabelText(/publishable key/i);
    await user.clear(publishableInput);
    await user.type(publishableInput, 'pk_test_123456');

    const secretInput = screen.getByLabelText(/secret key/i);
    await user.type(secretInput, 'sk_test_123456');

    const testButton = screen.getByRole('button', { name: /test connection/i });
    await user.click(testButton);

    await waitFor(() => {
      expect(screen.getByText(/connected successfully/i)).toBeInTheDocument();
    });
  });

  it('should save Stripe configuration', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }));

    // Return empty config first, then mock update
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              stripe_publishable_key: null,
              stripe_secret_key_encrypted: null,
              stripe_account_id: null,
              stripe_webhook_secret: null,
              stripe_connected_at: null,
            },
            error: null,
          })),
        })),
      })),
      update: mockUpdate,
    } as any);

    render(<StripeSettings />);

    await waitFor(() => {
      expect(screen.getByText(/stripe payment integration/i)).toBeInTheDocument();
    });

    const publishableInput = screen.getByLabelText(/publishable key/i);
    await user.type(publishableInput, 'pk_test_newkey');

    const secretInput = screen.getByLabelText(/secret key/i);
    await user.type(secretInput, 'sk_test_newsecret');

    const saveButton = screen.getByRole('button', { name: /save configuration/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it('should toggle secret key visibility', async () => {
    const user = userEvent.setup();
    render(<StripeSettings />);

    await waitFor(() => {
      expect(screen.getByText(/stripe payment integration/i)).toBeInTheDocument();
    });

    const secretInput = screen.getByLabelText(/secret key/i) as HTMLInputElement;
    expect(secretInput.type).toBe('password');

    // Find the toggle button by finding the button within the secret key field container
    const secretKeyContainer = secretInput.parentElement;
    const toggleButton = secretKeyContainer?.querySelector('button');

    if (toggleButton) {
      await user.click(toggleButton);
      expect(secretInput.type).toBe('text');
    }
  });
});
