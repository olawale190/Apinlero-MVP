import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { supabase } from './lib/supabase';
import { Landing } from './pages/Landing';
import { SignupForm } from './pages/SignupForm';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import DeliveryConfirm from './pages/DeliveryConfirm';
import OrderTracking from './pages/OrderTracking';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ConsentBanner from './components/ConsentBanner';

type View = 'landing' | 'storefront' | 'checkout' | 'confirmation' | 'login' | 'dashboard' | 'delivery';

// SaaS Dashboard App (for app.apinlero.com subdomain)
function SaaSDashboard() {
  // Check localStorage for demo mode (allows bypass without Supabase session)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('apinlero_demo_mode') === 'true';
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [businessName, setBusinessName] = useState('Isha\'s Treat & Groceries');
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session or demo mode
    const checkSession = async () => {
      // If demo mode is set, skip Supabase check
      if (localStorage.getItem('apinlero_demo_mode') === 'true') {
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsCheckingAuth(false);

      // In production, fetch business name from user profile
      // For now, default to Isha's Treat as first client
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Don't override demo mode
      if (localStorage.getItem('apinlero_demo_mode') !== 'true') {
        setIsAuthenticated(!!session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    // Clear demo mode
    localStorage.removeItem('apinlero_demo_mode');
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

  // Render Login page if not authenticated
  if (!isAuthenticated) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onViewStorefront={handleViewStorefront}
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
  );
}

// Helper to detect which subdomain we're on
function getSubdomain(): string | null {
  const hostname = window.location.hostname;

  // Check for store subdomains
  if (hostname.startsWith('ishas-treat.')) {
    return 'ishas-treat';
  }

  // Check for app subdomain (dashboard)
  if (hostname.startsWith('app.')) {
    return 'app';
  }

  // Check for localhost with port (development)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null; // Use path-based routing for local dev
  }

  return null;
}

// Main App with Router
export default function App() {
  const subdomain = getSubdomain();

  // If on ishas-treat subdomain, render store directly
  if (subdomain === 'ishas-treat') {
    return (
      <BrowserRouter>
        <Routes>
          {/* Store routes */}
          <Route path="/" element={<IshasTreatStore />} />
          <Route path="/store/ishas-treat/*" element={<IshasTreatStore />} />
          <Route path="/checkout" element={<IshasTreatStore />} />
          <Route path="/track" element={<OrderTracking />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/delivery/:orderId" element={<DeliveryConfirmWrapper />} />
          {/* Catch all for store subdomain */}
          <Route path="*" element={<IshasTreatStore />} />
        </Routes>
        <ConsentBanner />
      </BrowserRouter>
    );
  }

  // If on app subdomain, render dashboard directly
  if (subdomain === 'app') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SaaSDashboard />} />
          <Route path="/app/*" element={<SaaSDashboard />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="*" element={<SaaSDashboard />} />
        </Routes>
        <ConsentBanner />
      </BrowserRouter>
    );
  }

  // Default: path-based routing (for main domain and local dev)
  return (
    <BrowserRouter>
      <Routes>
        {/* SaaS Dashboard (app.apinlero.com) */}
        <Route path="/app" element={<SaaSDashboard />} />
        <Route path="/app/*" element={<SaaSDashboard />} />

        {/* Original Isha's Treat landing page at root */}
        <Route
          path="/"
          element={
            <Landing
              onStartTrial={() => window.location.href = '/signup'}
            />
          }
        />

        {/* Signup/trial form */}
        <Route
          path="/signup"
          element={
            <SignupForm
              onSuccess={() => window.location.href = '/store/ishas-treat'}
              onCancel={() => window.location.href = '/'}
            />
          }
        />

        {/* Isha's Treat store */}
        <Route path="/store/ishas-treat" element={<IshasTreatStore />} />
        <Route path="/store/ishas-treat/*" element={<IshasTreatStore />} />

        {/* Delivery confirmation (driver view) */}
        <Route
          path="/delivery/:orderId"
          element={<DeliveryConfirmWrapper />}
        />

        {/* Order tracking page (customer view) */}
        <Route path="/track" element={<OrderTracking />} />

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
