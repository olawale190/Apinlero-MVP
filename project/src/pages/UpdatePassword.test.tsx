import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UpdatePassword from './UpdatePassword';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(),
    },
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('UpdatePassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render update password form', () => {
    render(<UpdatePassword />);

    expect(screen.getByText('Set New Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it('should validate password length', async () => {
    const user = userEvent.setup({ delay: null });
    render(<UpdatePassword />);

    await user.type(screen.getByLabelText(/new password/i), 'short');
    await user.type(screen.getByLabelText(/confirm new password/i), 'short');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('should validate password match', async () => {
    const user = userEvent.setup({ delay: null });
    render(<UpdatePassword />);

    await user.type(screen.getByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'different123');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should update password successfully', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: {} },
      error: null,
    } as any);

    render(<UpdatePassword />);

    await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle update error', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid session' },
    } as any);

    render(<UpdatePassword />);

    await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid session')).toBeInTheDocument();
    });
  });
});
