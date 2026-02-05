import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useBusinessContext } from '../contexts/BusinessContext';
import { Product } from '../types';
import { MessageCircle } from 'lucide-react';
import StorefrontHeader from '../components/StorefrontHeader';
import Hero from '../components/Hero';
import CategoryFilter from '../components/CategoryFilter';
import SearchBox from '../components/SearchBox';
import ProductCard from '../components/ProductCard';
import CartDrawer from '../components/CartDrawer';
import StorefrontFooter from '../components/StorefrontFooter';

// Isha's Treat WhatsApp number (UK format)
const WHATSAPP_NUMBER = '+447448682282';
const WHATSAPP_MESSAGE = 'Hi! I would like to place an order from Isha\'s Treat.';

interface ShopProps {
  onCheckout: () => void;
  onViewDashboard?: () => void;
}

export default function Shop({ onCheckout, onViewDashboard }: ShopProps) {
  const { business } = useBusinessContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (business?.id) {
      fetchProducts();
    }
  }, [business?.id]);

  const fetchProducts = async () => {
    if (!business?.id) {
      console.warn('⚠️ No business_id available, skipping products load');
      setLoading(false);
      return;
    }

    try {
      console.log('🛍️ Loading products for business:', business.id);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      console.log(`✅ Loaded ${data?.length || 0} products for storefront`);
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' ||
      product.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = () => {
    setIsCartOpen(false);
    onCheckout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StorefrontHeader onCartClick={() => setIsCartOpen(true)} onDashboardClick={onViewDashboard} />
      <Hero />
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <SearchBox value={searchQuery} onChange={setSearchQuery} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <StorefrontFooter />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
      />

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105"
        title="Order via WhatsApp"
      >
        <MessageCircle size={24} fill="currentColor" />
        <span className="hidden sm:inline font-medium">Order on WhatsApp</span>
      </a>
    </div>
  );
}
