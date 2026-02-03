// User Menu Component
// Shows sign in button (guest) or user dropdown (authenticated)

import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Package, MapPin, Heart, Clock, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';

export default function UserMenu() {
  const { user, profile, isAuthenticated, isLoading, signOut, showAuthModal, hideAuthModal, isAuthModalOpen } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await signOut();
  };

  const navigateTo = (path: string) => {
    setIsDropdownOpen(false);
    window.location.href = path;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-2">
        <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  // Guest state - show sign in button
  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={showAuthModal}
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="hidden sm:inline">Sign In</span>
        </button>
        <AuthModal isOpen={isAuthModalOpen} onClose={hideAuthModal} />
      </>
    );
  }

  // Authenticated state - show user dropdown
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-1 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Account menu"
        >
          {/* Avatar */}
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-medium text-sm">
              {initials}
            </div>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => navigateTo('/account')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4 text-gray-400" />
                My Account
              </button>
              <button
                onClick={() => navigateTo('/account/orders')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Package className="w-4 h-4 text-gray-400" />
                My Orders
              </button>
              <button
                onClick={() => navigateTo('/account/wishlist')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Heart className="w-4 h-4 text-gray-400" />
                Wishlist
              </button>
              <button
                onClick={() => navigateTo('/account/addresses')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <MapPin className="w-4 h-4 text-gray-400" />
                Saved Addresses
              </button>
              <button
                onClick={() => navigateTo('/account/recently-viewed')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Clock className="w-4 h-4 text-gray-400" />
                Recently Viewed
              </button>
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-100 py-1">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={hideAuthModal} />
    </>
  );
}
