import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordReset from './PasswordReset';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
    },
  },
}));

describe('PasswordReset Component', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render password reset form', () => {
    render(<PasswordReset onBack={mockOnBack} />);

    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('owner@ishastreat.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('should send reset email successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      data: {},
      error: null,
    } as any);

    render(<PasswordReset onBack={mockOnBack} />);

    await user.type(screen.getByPlaceholderText('owner@ishastreat.com'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/password reset link sent/i)).toBeInTheDocument();
    });
  });

  it('should handle reset email error', async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      data: {},
      error: { message: 'User not found' },
    } as any);

    render(<PasswordReset onBack={mockOnBack} />);

    await user.type(screen.getByPlaceholderText('owner@ishastreat.com'), 'notfound@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('should call onBack when back button clicked', async () => {
    const user = userEvent.setup();
    render(<PasswordReset onBack={mockOnBack} />);

    await user.click(screen.getByText(/back to login/i));

    expect(mockOnBack).toHaveBeenCalled();
  });
});
