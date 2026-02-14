import { useState, useEffect } from 'react';
import {
  Store,
  LogOut,
  LayoutDashboard,
  Sparkles,
  MessageCircle,
  Users,
  Calendar,
  Gift,
  AlertTriangle,
  BarChart3,
  Truck,
  Package,
  ExternalLink,
  Building2,
  ChevronDown,
  Mail,
  Check,
  Settings,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';
import { supabase, type Order, type Product } from '../lib/supabase';
import { triggerDailySummary, isN8nConfigured } from '../lib/n8n';
import { useBusinessContext } from '../contexts/BusinessContext';
import AISummary from '../components/AISummary';
import StatsCards from '../components/StatsCards';
import OrdersTable from '../components/OrdersTable';
import NewOrderForm from '../components/NewOrderForm';
import AIInsightsPanel from '../components/AIInsightsPanel';
import WhatsAppPromotions from '../components/WhatsAppPromotions';
import AskApinlero from '../components/AskApinlero';
import CustomerPrediction from '../components/CustomerPrediction';
import { CalendarSystem } from '../components/calendar';
import SmartBundles from '../components/SmartBundles';
import ExpiryWastePredictor from '../components/ExpiryWastePredictor';
import ChannelVisualization from '../components/ChannelVisualization';
import DeliveryOptimizer from '../components/DeliveryOptimizer';
import InventoryManager from '../components/InventoryManager';
import PurchaseOrders from '../components/PurchaseOrders';
import StripeSettings from './StripeSettings';
import SalesInventoryAnalytics from '../components/SalesInventoryAnalytics';

interface DashboardProps {
  onLogout: () => void;
  onViewStorefront: () => void;
  businessName?: string;
}

type TabType = 'overview' | 'insights' | 'promotions' | 'customers' | 'calendar' | 'bundles' | 'expiry' | 'channels' | 'delivery' | 'inventory' | 'purchase' | 'analytics' | 'settings';

const tabs: { id: TabType; label: string; icon: React.ReactNode; mobileLabel: string }[] = [
  { id: 'overview', label: 'Overview', mobileLabel: 'Home', icon: <LayoutDashboard size={16} /> },
  { id: 'insights', label: 'AI Insights', mobileLabel: 'AI', icon: <Sparkles size={16} /> },
  { id: 'promotions', label: 'Promotions', mobileLabel: 'Promo', icon: <MessageCircle size={16} /> },
  { id: 'customers', label: 'Customers', mobileLabel: 'Cust', icon: <Users size={16} /> },
  { id: 'calendar', label: 'Calendar', mobileLabel: 'Events', icon: <Calendar size={16} /> },
  { id: 'bundles', label: 'Bundles', mobileLabel: 'Bundles', icon: <Gift size={16} /> },
  { id: 'expiry', label: 'Expiry', mobileLabel: 'Expiry', icon: <AlertTriangle size={16} /> },
  { id: 'channels', label: 'Channels', mobileLabel: 'Stats', icon: <BarChart3 size={16} /> },
  { id: 'delivery', label: 'Delivery', mobileLabel: 'Delivery', icon: <Truck size={16} /> },
  { id: 'inventory', label: 'Inventory', mobileLabel: 'Stock', icon: <Package size={16} /> },
  { id: 'purchase', label: 'Purchase Orders', mobileLabel: 'Purchase', icon: <ShoppingCart size={16} /> },
  { id: 'analytics', label: 'Analytics', mobileLabel: 'Analytics', icon: <TrendingUp size={16} /> },
  { id: 'settings', label: 'Settings', mobileLabel: 'Settings', icon: <Settings size={16} /> },
];

export default function Dashboard({ onLogout, onViewStorefront, businessName = "Isha's Treat & Groceries" }: DashboardProps) {
  // Get business from context - will be undefined for app.apinlero.com
  const businessContext = useBusinessContext();
  const [business, setBusiness] = useState(businessContext?.business || null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAISummary, setShowAISummary] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // Handle sending daily summary email
  const handleSendDailyReport = async () => {
    setSendingReport(true);
    const result = await triggerDailySummary();
    if (result.success) {
      setReportSent(true);
      setTimeout(() => setReportSent(false), 3000);
    } else {
      alert(result.error || 'Failed to send report');
    }
    setSendingReport(false);
  };

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Load business from authenticated user if not available from context (app.apinlero.com case)
  useEffect(() => {
    async function loadUserBusiness() {
      // If we already have business from context, use it
      if (businessContext?.business) {
        setBusiness(businessContext.business);
        return;
      }

      console.log('[Dashboard] No business from context, loading from authenticated user...');

      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error('[Dashboard] ❌ No authenticated user:', userError);
          setIsLoading(false);
          return;
        }

        console.log('[Dashboard] User authenticated:', user.email);

        // Strategy 1: Try user_businesses table (if it exists)
        try {
          const { data: userBusinessData, error: ubError } = await supabase
            .from('user_businesses')
            .select(`
              business_id,
              role,
              businesses (
                id,
                slug,
                name,
                owner_email,
                phone,
                is_active
              )
            `)
            .eq('user_id', user.id)
            .limit(1)
            .single();

          if (!ubError && userBusinessData) {
            const businessData = userBusinessData.businesses as any;
            if (businessData && businessData.is_active) {
              console.log('[Dashboard] ✅ Loaded business via user_businesses:', businessData.name);
              setBusiness({
                id: businessData.id,
                slug: businessData.slug,
                name: businessData.name,
                owner_email: businessData.owner_email,
                phone: businessData.phone,
                is_active: businessData.is_active
              });
              return;
            }
          }
          console.warn('[Dashboard] user_businesses lookup failed, trying fallback...', ubError?.message);
        } catch {
          console.warn('[Dashboard] user_businesses table may not exist, trying fallback...');
        }

        // Strategy 2: Fallback - find business by owner_email
        console.log('[Dashboard] Trying to find business by owner email:', user.email);
        const { data: businessByEmail, error: emailError } = await supabase
          .from('businesses')
          .select('id, slug, name, owner_email, phone, is_active')
          .eq('owner_email', user.email)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (!emailError && businessByEmail) {
          console.log('[Dashboard] ✅ Loaded business via owner_email:', businessByEmail.name);
          setBusiness({
            id: businessByEmail.id,
            slug: businessByEmail.slug,
            name: businessByEmail.name,
            owner_email: businessByEmail.owner_email,
            phone: businessByEmail.phone,
            is_active: businessByEmail.is_active
          });
          return;
        }

        console.warn('[Dashboard] owner_email lookup failed:', emailError?.message);

        // Strategy 3: Last resort - get first active business (single-tenant fallback)
        console.log('[Dashboard] Trying last resort: first active business...');
        const { data: anyBusiness, error: anyError } = await supabase
          .from('businesses')
          .select('id, slug, name, owner_email, phone, is_active')
          .eq('is_active', true)
          .limit(1)
          .single();

        if (!anyError && anyBusiness) {
          console.log('[Dashboard] ✅ Loaded business (first active):', anyBusiness.name);
          setBusiness({
            id: anyBusiness.id,
            slug: anyBusiness.slug,
            name: anyBusiness.name,
            owner_email: anyBusiness.owner_email,
            phone: anyBusiness.phone,
            is_active: anyBusiness.is_active
          });
          return;
        }

        console.warn('[Dashboard] Strategy 3 failed:', anyError?.message);

        // Strategy 4: Recovery - create business from user metadata (trigger may have failed)
        const userMeta = user.user_metadata;
        if (userMeta?.role === 'business_owner' && userMeta?.business_name) {
          console.log('[Dashboard] Attempting recovery: creating business from user metadata...');
          const recoverySlug = userMeta.business_slug || userMeta.business_name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

          const { data: recoveredBusiness, error: recoverError } = await supabase
            .from('businesses')
            .insert({
              slug: recoverySlug,
              name: userMeta.business_name,
              owner_email: user.email,
              phone: userMeta.phone || null,
              business_type: userMeta.business_type || null,
              subscription_tier: userMeta.plan || 'solo',
              is_active: true,
            })
            .select()
            .single();

          if (!recoverError && recoveredBusiness) {
            // Also create user_businesses link
            await supabase.from('user_businesses').insert({
              user_id: user.id,
              business_id: recoveredBusiness.id,
              role: 'owner',
            });

            console.log('[Dashboard] ✅ Recovery succeeded:', recoveredBusiness.name);
            setBusiness({
              id: recoveredBusiness.id,
              slug: recoveredBusiness.slug,
              name: recoveredBusiness.name,
              owner_email: recoveredBusiness.owner_email,
              phone: recoveredBusiness.phone,
              is_active: recoveredBusiness.is_active,
            });
            return;
          }

          console.error('[Dashboard] Recovery failed:', recoverError?.message);
        }

        console.error('[Dashboard] ❌ No business found at all');
        setIsLoading(false);
      } catch (error) {
        console.error('[Dashboard] Error loading user business:', error);
        setIsLoading(false);
      }
    }

    loadUserBusiness();
  }, [businessContext?.business]);

  useEffect(() => {
    if (!business?.id) {
      console.log('[Dashboard] Waiting for business to load...');
      return;
    }

    console.log('[Dashboard] Business loaded, fetching data for:', business.name);
    loadOrders();
    loadProducts();
    setIsLoading(false);

    // Set up real-time subscription for orders
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [business?.id]);

  const loadOrders = async () => {
    if (!business?.id) {
      console.warn('⚠️ No business_id available, skipping orders load');
      return;
    }

    console.log('📋 Loading orders from database for business:', business.id);

    // Try with business_id filter first (multi-tenant)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      console.log(`✅ Loaded ${data.length} orders from database`);
      setOrders(data);
    } else if (error) {
      // Fallback: business_id column may not exist yet (pre-migration)
      console.warn('⚠️ business_id filter failed, loading all orders:', error.message);
      const { data: allData, error: allError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!allError && allData) {
        console.log(`✅ Loaded ${allData.length} orders (fallback, no business_id filter)`);
        setOrders(allData);
      } else if (allError) {
        console.error('❌ Error loading orders:', allError);
      }
    }
  };

  const loadProducts = async () => {
    if (!business?.id) {
      console.warn('⚠️ No business_id available, skipping products load');
      return;
    }

    console.log('📦 Loading products from database for business:', business.id);

    // Try with business_id filter first (multi-tenant)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', business.id)
      .order('name', { ascending: true });

    if (!error && data) {
      console.log(`✅ Loaded ${data.length} products from database`);
      // Prices are already stored in pounds in the database
      setProducts(data);
    } else if (error) {
      // Fallback: business_id column may not exist yet (pre-migration)
      console.warn('⚠️ business_id filter failed, loading all products:', error.message);
      const { data: allData, error: allError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!allError && allData) {
        console.log(`✅ Loaded ${allData.length} products (fallback, no business_id filter)`);
        // Prices are already stored in pounds in the database
        setProducts(allData);
      } else if (allError) {
        console.error('❌ Error loading products:', allError);
      }
    }
  };

  const handleGenerateSummary = () => {
    setShowAISummary(!showAISummary);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SaaS Header - Àpínlẹ̀rọ Branding */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">À</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Àpínlẹ̀rọ</h1>
                <p className="text-xs text-slate-400">Order Management Platform</p>
              </div>
            </div>

            {/* Business Selector */}
            <div className="relative">
              <button
                onClick={() => setShowBusinessMenu(!showBusinessMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
              >
                <Building2 size={18} className="text-teal-400" />
                <span className="hidden sm:inline font-medium">{businessName}</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {showBusinessMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Your Business</p>
                  </div>
                  <div className="px-4 py-3 flex items-center gap-3 bg-teal-50">
                    <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
                      <span className="text-white font-bold">IT</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{businessName}</p>
                      <p className="text-xs text-gray-500">Starter Plan</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400">First client on Àpínlẹ̀rọ</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onViewStorefront}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <Store size={18} />
                <span className="hidden sm:inline">View Store</span>
                <ExternalLink size={14} className="hidden sm:inline" />
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Header - Business Dashboard */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{businessName}</h2>
              <p className="text-sm text-gray-500">{today}</p>
            </div>
            <div className="flex items-center gap-2">
              {isN8nConfigured() && (
                <button
                  onClick={handleSendDailyReport}
                  disabled={sendingReport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 shadow-md disabled:opacity-50"
                  style={{ backgroundColor: reportSent ? '#059669' : '#1e3a5f', color: 'white' }}
                >
                  {reportSent ? (
                    <>
                      <Check size={18} />
                      <span className="hidden sm:inline">Sent!</span>
                    </>
                  ) : sendingReport ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Mail size={18} />
                      <span className="hidden sm:inline">Email Report</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleGenerateSummary}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 shadow-md"
                style={{ backgroundColor: '#0d9488' }}
              >
                <Sparkles size={18} />
                <span className="hidden sm:inline">AI Summary</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.mobileLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Overview Tab - Original Dashboard */}
        {activeTab === 'overview' && (
          <>
            {showAISummary && <AISummary orders={orders} />}
            <StatsCards orders={orders} />
            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 order-2 lg:order-1">
                <OrdersTable orders={orders} onOrderUpdate={loadOrders} />
              </div>
              <div className="lg:col-span-1 order-1 lg:order-2">
                <NewOrderForm onOrderCreated={loadOrders} />
              </div>
            </div>
          </>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <AIInsightsPanel orders={orders} products={products} />
          </div>
        )}

        {/* WhatsApp Promotions Tab */}
        {activeTab === 'promotions' && (
          <div className="space-y-6">
            <WhatsAppPromotions orders={orders} products={products} />
          </div>
        )}

        {/* Customer Prediction Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <CustomerPrediction orders={orders} />
          </div>
        )}

        {/* Events Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <CalendarSystem products={products} orders={orders} />
          </div>
        )}

        {/* Smart Bundles Tab */}
        {activeTab === 'bundles' && (
          <div className="space-y-6">
            <SmartBundles orders={orders} products={products} />
          </div>
        )}

        {/* Expiry & Waste Predictor Tab */}
        {activeTab === 'expiry' && (
          <div className="space-y-6">
            <ExpiryWastePredictor orders={orders} products={products} />
          </div>
        )}

        {/* Channel Visualization Tab */}
        {activeTab === 'channels' && (
          <div className="space-y-6">
            <ChannelVisualization orders={orders} />
          </div>
        )}

        {/* Delivery Optimizer Tab */}
        {activeTab === 'delivery' && (
          <div className="space-y-6">
            <DeliveryOptimizer orders={orders} />
          </div>
        )}

        {/* Inventory Manager Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <InventoryManager products={products} onProductUpdate={loadProducts} business={business} />
          </div>
        )}

        {/* Purchase Orders Tab */}
        {activeTab === 'purchase' && (
          <div className="space-y-6">
            <PurchaseOrders products={products} onProductUpdate={loadProducts} business={business} />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <SalesInventoryAnalytics orders={orders} products={products} />
          </div>
        )}

        {/* Settings Tab - Stripe Integration */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <StripeSettings />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">À</span>
              </div>
              <span className="text-sm text-gray-600">Powered by <strong>Àpínlẹ̀rọ</strong></span>
            </div>
            <p className="text-xs text-gray-400">
              AI-Powered Order Management for African & Caribbean Food Wholesale
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Ask Àpínlẹ̀rọ Chat */}
      <AskApinlero orders={orders} products={products} />
    </div>
  );
}
