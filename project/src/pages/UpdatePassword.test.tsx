import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

vi.mock('../lib/business-resolver', () => ({
  getCurrentSubdomain: () => 'app',
  buildSubdomainUrl: (subdomain: string, path: string) => `https://${subdomain}.example.com${path}`,
}));

describe('UpdatePassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render update password form', () => {
    render(<UpdatePassword />);

    expect(screen.getByText('Set New Password')).toBeInTheDocument();
    expect(screen.getByText('New Password')).toBeInTheDocument();
    expect(screen.getByText('Confirm New Password')).toBeInTheDocument();
  });

  it('should validate password length', async () => {
    const user = userEvent.setup();
    render(<UpdatePassword />);

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'short');
    await user.type(passwordInputs[1], 'short');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('should validate password match', async () => {
    const user = userEvent.setup();
    render(<UpdatePassword />);

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'password123');
    await user.type(passwordInputs[1], 'different123');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should update password successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: {} },
      error: null,
    } as any);

    render(<UpdatePassword />);

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'newpassword123');
    await user.type(passwordInputs[1], 'newpassword123');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle update error', async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid session' },
    } as any);

    render(<UpdatePassword />);

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await user.type(passwordInputs[0], 'newpassword123');
    await user.type(passwordInputs[1], 'newpassword123');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid session')).toBeInTheDocument();
    });
  });
});
