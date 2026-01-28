import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StripeSettings from './StripeSettings';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              stripe_publishable_key: 'pk_test_123',
              stripe_secret_key_encrypted: null,
              stripe_account_id: 'acct_123',
              stripe_webhook_secret: null,
              stripe_connected_at: '2024-01-01',
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('StripeSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Stripe settings page', async () => {
    render(<StripeSettings />);

    await waitFor(() => {
      expect(screen.getByText(/stripe/i)).toBeInTheDocument();
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
      expect(screen.getByText(/stripe/i)).toBeInTheDocument();
    });

    const publishableInput = screen.getByLabelText(/publishable key/i);
    await user.clear(publishableInput);
    await user.type(publishableInput, 'invalid_key');

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
      expect(screen.getByText(/stripe/i)).toBeInTheDocument();
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
      expect(screen.getByText(/stripe/i)).toBeInTheDocument();
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
      eq: vi.fn(() => ({ error: null })),
    }));
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
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
      expect(screen.getByText(/stripe/i)).toBeInTheDocument();
    });

    const publishableInput = screen.getByLabelText(/publishable key/i);
    await user.type(publishableInput, 'pk_test_newkey');

    const secretInput = screen.getByLabelText(/secret key/i);
    await user.type(secretInput, 'sk_test_newsecret');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it('should toggle secret key visibility', async () => {
    const user = userEvent.setup();
    render(<StripeSettings />);

    await waitFor(() => {
      expect(screen.getByText(/stripe/i)).toBeInTheDocument();
    });

    const secretInput = screen.getByLabelText(/secret key/i) as HTMLInputElement;
    expect(secretInput.type).toBe('password');

    const toggleButton = screen.getByRole('button', { name: /show secret key/i });
    await user.click(toggleButton);

    expect(secretInput.type).toBe('text');
  });
});
