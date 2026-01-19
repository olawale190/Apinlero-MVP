import { ShoppingCart, LayoutDashboard } from 'lucide-react';
import { shopConfig } from '../config/shop';
import { useCart } from '../context/CartContext';
import { colors } from '../config/colors';

interface StorefrontHeaderProps {
  onCartClick: () => void;
  onDashboardClick?: () => void;
}

export default function StorefrontHeader({ onCartClick, onDashboardClick }: StorefrontHeaderProps) {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{shopConfig.name}</h1>
            <p className="text-sm text-gray-600">{shopConfig.tagline}</p>
          </div>

          <div className="flex items-center gap-2">
            {onDashboardClick && (
              <button
                onClick={onDashboardClick}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Owner Dashboard"
                title="Owner Dashboard"
              >
                <LayoutDashboard className="w-6 h-6 text-gray-700" />
              </button>
            )}
            <button
              onClick={onCartClick}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {cartCount > 0 && (
                <span className={`absolute -top-1 -right-1 ${colors.tailwind.primaryMain} text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
