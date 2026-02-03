// Wishlist Page
// Customer wishlist display

import { ArrowLeft, Heart, ShoppingBag, Loader2, Trash2 } from 'lucide-react';
import { useWishlist } from '../../hooks/useWishlist';
import { useCart } from '../../context/CartContext';
import { colors } from '../../config/colors';
import { shopConfig } from '../../config/shop';

export default function WishlistPage() {
  const { products, isLoading, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart(product, 1);
  };

  const handleRemove = async (productId: string) => {
    await removeFromWishlist(productId);
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear your wishlist?')) {
      await clearWishlist();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/'}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Back to shop"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">My Wishlist</h1>
          </div>
          {products.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Navigation */}
        <nav className="flex flex-wrap gap-2 mb-6">
          <a href="/account" className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100">
            Profile
          </a>
          <a href="/account/orders" className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100">
            Orders
          </a>
          <a href="/account/addresses" className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100">
            Addresses
          </a>
          <a href="/account/wishlist" className={`px-4 py-2 rounded-lg text-sm font-medium ${colors.tailwind.primaryMain} text-white`}>
            Wishlist
          </a>
        </nav>

        {/* Wishlist Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-4">Save items you love by tapping the heart icon.</p>
            <a
              href="/"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium ${colors.tailwind.primaryMain} ${colors.tailwind.primaryHover}`}
            >
              <ShoppingBag size={18} />
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="aspect-square bg-gray-100 relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-white transition-colors shadow-sm"
                    title="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.unit}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold ${colors.tailwind.primaryMainText}`}>
                      {shopConfig.currency}{product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${colors.tailwind.primaryMain} ${colors.tailwind.primaryHover}`}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
