import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess: () => void;
  onViewStorefront: () => void;
}

export default function Login({ onLoginSuccess, onViewStorefront }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'owner',
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
        } else {
          setError('Check your email for a confirmation link!');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
        } else {
          onLoginSuccess();
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  // Demo login for pilot testing - direct access, no auth required
  const handleDemoLogin = () => {
    // Set demo mode flag and go directly to dashboard
    localStorage.setItem('apinlero_demo_mode', 'true');
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-0">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-8">
          {/* Logo and Title */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2" style={{ color: '#1e3a5f' }}>
              Isha's Treat & Groceries
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Business Dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`flex items-center gap-2 p-3 rounded-lg mb-6 ${
              error.includes('Check your email')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="owner@ishastreat.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#0d9488' }}
            >
              {isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-teal-600 hover:text-teal-700"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Demo Login Button */}
          <button
            onClick={handleDemoLogin}
            className="w-full py-3 rounded-lg font-medium transition-all border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
          >
            Demo Login (Pilot Testing)
          </button>

          {/* View Storefront Link */}
          <div className="mt-6 text-center">
            <button
              onClick={onViewStorefront}
              className="text-sm text-gray-600 hover:text-teal-600"
            >
              ← View Customer Storefront
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Powered by Àpínlẹ̀rọ · Your AI Operations Partner
        </p>
      </div>
    </div>
  );
}
