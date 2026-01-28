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
  Settings
} from 'lucide-react';
import { supabase, type Order, type Product } from '../lib/supabase';
import { triggerDailySummary, isN8nConfigured } from '../lib/n8n';
import AISummary from '../components/AISummary';
import StatsCards from '../components/StatsCards';
import OrdersTable from '../components/OrdersTable';
import NewOrderForm from '../components/NewOrderForm';
import AIInsightsPanel from '../components/AIInsightsPanel';
import WhatsAppPromotions from '../components/WhatsAppPromotions';
import AskApinlero from '../components/AskApinlero';
import CustomerPrediction from '../components/CustomerPrediction';
import CulturalEventCalendar from '../components/CulturalEventCalendar';
import SmartBundles from '../components/SmartBundles';
import ExpiryWastePredictor from '../components/ExpiryWastePredictor';
import ChannelVisualization from '../components/ChannelVisualization';
import DeliveryOptimizer from '../components/DeliveryOptimizer';
import InventoryManager from '../components/InventoryManager';
import StripeSettings from './StripeSettings';

interface DashboardProps {
  onLogout: () => void;
  onViewStorefront: () => void;
  businessName?: string;
}

type TabType = 'overview' | 'insights' | 'promotions' | 'customers' | 'calendar' | 'bundles' | 'expiry' | 'channels' | 'delivery' | 'inventory' | 'settings';

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
  { id: 'settings', label: 'Settings', mobileLabel: 'Settings', icon: <Settings size={16} /> },
];

export default function Dashboard({ onLogout, onViewStorefront, businessName = "Isha's Treat & Groceries" }: DashboardProps) {
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

  useEffect(() => {
    loadOrders();
    loadProducts();

    // Set up real-time subscription
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
  }, []);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setIsLoading(false);
  };

  const loadProducts = async () => {
    console.log('📦 Loading products from database...');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      console.log(`✅ Loaded ${data.length} products from database`);
      setProducts(data);
    } else if (error) {
      console.error('❌ Error loading products:', error);
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
            <WhatsAppPromotions orders={orders} />
          </div>
        )}

        {/* Customer Prediction Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <CustomerPrediction orders={orders} />
          </div>
        )}

        {/* Cultural Event Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <CulturalEventCalendar orders={orders} products={products} />
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
            <InventoryManager products={products} onProductUpdate={loadProducts} />
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
