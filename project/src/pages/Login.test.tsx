import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

describe('Login Component', () => {
  const mockOnLoginSuccess = vi.fn();
  const mockOnViewStorefront = vi.fn();
  const mockOnForgotPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render login form', () => {
    render(
      <Login
        onLoginSuccess={mockOnLoginSuccess}
        onViewStorefront={mockOnViewStorefront}
      />
    );

    expect(screen.getByText("Isha's Treat & Groceries")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('owner@ishastreat.com')).toBeInTheDocument();
  });

  it('should sign in successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: '123' }, session: {} },
      error: null,
    } as any);

    render(
      <Login
        onLoginSuccess={mockOnLoginSuccess}
        onViewStorefront={mockOnViewStorefront}
      />
    );

    await user.type(screen.getByPlaceholderText('owner@ishastreat.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });

  it('should handle demo login', async () => {
    const user = userEvent.setup();
    render(
      <Login
        onLoginSuccess={mockOnLoginSuccess}
        onViewStorefront={mockOnViewStorefront}
      />
    );

    await user.click(screen.getByRole('button', { name: /demo login/i }));

    // Check that localStorage was called with the correct values
    expect(localStorage.setItem).toHaveBeenCalledWith('apinlero_demo_mode', 'true');
    expect(mockOnLoginSuccess).toHaveBeenCalled();
  });
});
