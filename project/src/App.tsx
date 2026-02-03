import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { BusinessProvider, useBusinessContext } from './contexts/BusinessContext';
import { AuthProvider } from './contexts/AuthContext';
import { getCurrentSubdomain } from './lib/business-resolver';
import { supabase } from './lib/supabase';
import { Landing } from './pages/Landing';
import { SignupForm } from './pages/SignupForm';
import EmailSettings from './pages/EmailSettings';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PasswordReset from './pages/PasswordReset';
import UpdatePassword from './pages/UpdatePassword';
import DeliveryConfirm from './pages/DeliveryConfirm';
import OrderTracking from './pages/OrderTracking';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ConsentBanner from './components/ConsentBanner';
// Account pages
import AccountPage from './pages/account/AccountPage';
import OrderHistoryPage from './pages/account/OrderHistoryPage';
import AddressesPage from './pages/account/AddressesPage';
import WishlistPage from './pages/account/WishlistPage';
import RecentlyViewedPage from './pages/account/RecentlyViewedPage';

type View = 'landing' | 'storefront' | 'checkout' | 'confirmation' | 'login' | 'dashboard' | 'delivery' | 'password-reset';

// SaaS Dashboard App (for app.apinlero.com subdomain)
function SaaSDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [businessName, setBusinessName] = useState('Isha\'s Treat & Groceries');
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing Supabase session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsCheckingAuth(false);

      // In production, fetch business name from user profile
      // For now, default to Isha's Treat as first client
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  const handleViewStorefront = () => {
    // Open storefront in new tab (customer view)
    window.open('https://ishas-treat.apinlero.com', '_blank');
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading Àpínlẹ̀rọ...</p>
        </div>
      </div>
    );
  }

  // Render Password Reset page if requested
  if (showPasswordReset) {
    return (
      <PasswordReset
        onBack={() => setShowPasswordReset(false)}
      />
    );
  }

  // Render Login page if not authenticated
  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onViewStorefront={handleViewStorefront}
        onForgotPassword={() => setShowPasswordReset(true)}
      />
    );
  }

  // Render Dashboard (authenticated)
  return (
    <Dashboard
      onLogout={handleLogout}
      onViewStorefront={handleViewStorefront}
      businessName={businessName}
    />
  );
}

// Store wrapper component for Isha's Treat (Customer-facing storefront)
function IshasTreatStore() {
  const [currentView, setCurrentView] = useState<'storefront' | 'checkout' | 'confirmation'>('storefront');
  const [orderId, setOrderId] = useState('');

  // Storefront handlers
  const handleCheckout = () => {
    setCurrentView('checkout');
  };

  const handleOrderSuccess = (newOrderId: string) => {
    setOrderId(newOrderId);
    setCurrentView('confirmation');
  };

  const handleContinueShopping = () => {
    setCurrentView('storefront');
    setOrderId('');
  };

  const handleBackToShop = () => {
    setCurrentView('storefront');
  };

  const handleViewDashboard = () => {
    // Redirect to SaaS dashboard subdomain (for store owner)
    window.location.href = 'https://app.apinlero.com';
  };

  // Render Storefront (customer view) - no auth required
  return (
    <AuthProvider>
      <CartProvider>
        {currentView === 'storefront' && (
          <Shop
            onCheckout={handleCheckout}
            onViewDashboard={handleViewDashboard}
          />
        )}
        {currentView === 'checkout' && (
          <Checkout onBack={handleBackToShop} onSuccess={handleOrderSuccess} />
        )}
        {currentView === 'confirmation' && (
          <Confirmation orderId={orderId} onContinueShopping={handleContinueShopping} />
        )}
      </CartProvider>
    </AuthProvider>
  );
}

// Main App with Router - Wrapped with BusinessProvider
export default function App() {
  return (
    <BusinessProvider>
      <AppRoutes />
    </BusinessProvider>
  );
}

// App Routes Component - Uses BusinessContext for dynamic routing
function AppRoutes() {
  const { subdomain, business, isLoading, isAppDashboard, isBusinessStore, error } = useBusinessContext();

  // Show loading state while resolving business
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  // BUSINESS SUBDOMAIN ROUTING (e.g., ishas-treat.apinlero.com)
  // Dynamic: handles ANY business subdomain by looking up from database
  if (isBusinessStore) {
    // Subdomain doesn't match any active business → 404
    if (!business) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold text-white mb-4">Store Not Found</h1>
          <p className="text-slate-300 mb-8">The store "{subdomain}" does not exist or is no longer active.</p>
          <a href="https://apinlero.com" className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600">
            Go to Apinlero Home
          </a>
        </div>
      );
    }

    // Valid business subdomain → show their store
    return (
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Store routes */}
              <Route path="/" element={<IshasTreatStore />} />
              <Route path="/store/ishas-treat/*" element={<IshasTreatStore />} />
              <Route path="/checkout" element={<IshasTreatStore />} />
              <Route path="/track" element={<OrderTracking />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/delivery/:orderId" element={<DeliveryConfirmWrapper />} />
              <Route path="/reset-password" element={<UpdatePassword />} />
              {/* Account routes */}
              <Route path="/account" element={<AccountPage />} />
              <Route path="/account/orders" element={<OrderHistoryPage />} />
              <Route path="/account/addresses" element={<AddressesPage />} />
              <Route path="/account/wishlist" element={<WishlistPage />} />
              <Route path="/account/recently-viewed" element={<RecentlyViewedPage />} />
              {/* Catch all for store subdomain */}
              <Route path="*" element={<IshasTreatStore />} />
            </Routes>
            <ConsentBanner />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  // APP SUBDOMAIN ROUTING (app.apinlero.com) - Dashboard
  if (subdomain === 'app' || isAppDashboard) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SaaSDashboard />} />
          <Route path="/app/*" element={<SaaSDashboard />} />
          <Route path="/reset-password" element={<UpdatePassword />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="*" element={<SaaSDashboard />} />
        </Routes>
        <ConsentBanner />
      </BrowserRouter>
    );
  }

  // ROOT DOMAIN (apinlero.com) or LOCALHOST - Path-based routing
  return (
    <BrowserRouter>
      <Routes>
        {/* SaaS Dashboard (path-based for localhost) */}
        <Route path="/app" element={<SaaSDashboard />} />
        <Route path="/app/*" element={<SaaSDashboard />} />
        <Route path="/reset-password" element={<UpdatePassword />} />

        {/* Landing page */}
        <Route
          path="/"
          element={
            <Landing
              onStartTrial={() => window.location.href = '/signup'}
            />
          }
        />

        {/* Signup form with DYNAMIC redirect */}
        <Route
          path="/signup"
          element={
            <SignupForm
              onSuccess={(businessSubdomain?: string) => {
                // Redirect to the business store subdomain
                if (businessSubdomain) {
                  // In production: redirect to subdomain
                  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    window.location.href = `https://${businessSubdomain}.apinlero.com`;
                  } else {
                    // In development: use path-based routing
                    window.location.href = `/store/${businessSubdomain}`;
                  }
                } else {
                  // Fallback: default to Isha's Treat store
                  window.location.href = '/store/ishas-treat';
                }
              }}
              onCancel={() => window.location.href = '/'}
            />
          }
        />

        {/* Legacy path-based store route (for localhost development) */}
        <Route path="/store/ishas-treat" element={<IshasTreatStore />} />
        <Route path="/store/ishas-treat/*" element={<IshasTreatStore />} />

        {/* Account routes (for localhost development) */}
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/orders" element={<OrderHistoryPage />} />
        <Route path="/account/addresses" element={<AddressesPage />} />
        <Route path="/account/wishlist" element={<WishlistPage />} />
        <Route path="/account/recently-viewed" element={<RecentlyViewedPage />} />

        {/* Delivery confirmation (driver view) */}
        <Route
          path="/delivery/:orderId"
          element={<DeliveryConfirmWrapper />}
        />

        {/* Order tracking page (customer view) */}
        <Route path="/track" element={<OrderTracking />} />

        {/* Email testing page */}
        <Route path="/email-settings" element={<EmailSettings />} />

        {/* Legal pages */}
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ConsentBanner />
    </BrowserRouter>
  );
}

// Wrapper for delivery confirmation to extract URL params
function DeliveryConfirmWrapper() {
  const params = new URLSearchParams(window.location.search);
  const orderId = window.location.pathname.split('/').pop() || '';
  const token = params.get('token') || '';

  return <DeliveryConfirm orderId={orderId} token={token} />;
}
