import { useState } from 'react';
import { Package, Plus, Minus, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { shopConfig } from '../config/shop';
import { useCart } from '../context/CartContext';
import { colors } from '../config/colors';
import WishlistButton from './WishlistButton';
import ProductImagePlaceholder from './ProductImagePlaceholder';

interface ProductCardProps {
  product: Product;
}

function getStockStatus(quantity?: number): { label: string; color: string; canOrder: boolean } {
  if (quantity === undefined || quantity === null) {
    return { label: 'In Stock', color: 'bg-green-100 text-green-800', canOrder: true };
  }
  if (quantity <= 0) {
    return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', canOrder: false };
  }
  if (quantity <= 5) {
    return { label: `Low Stock (${quantity})`, color: 'bg-amber-100 text-amber-800', canOrder: true };
  }
  return { label: 'In Stock', color: 'bg-green-100 text-green-800', canOrder: true };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const stockStatus = getStockStatus(product.stock_quantity);

  const handleAdd = () => {
    if (quantity > 0 && stockStatus.canOrder) {
      addToCart(product, quantity);
      setQuantity(1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ProductImagePlaceholder productName={product.name} className="w-full h-full" />
        )}
        {/* Wishlist button */}
        <WishlistButton productId={product.id} className="absolute top-2 left-2" size="sm" />
        {/* Stock badge */}
        <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
          {stockStatus.label}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{product.unit}</p>

        <div className="flex items-center justify-between mb-3">
          <span className={`text-xl font-bold ${colors.tailwind.primaryMainText}`}>
            {shopConfig.currency}{product.price.toFixed(2)}
          </span>
        </div>

        {stockStatus.canOrder ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 min-w-[3rem] text-center font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-gray-100 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              className={`flex-1 ${colors.tailwind.primaryMain} text-white px-4 py-2 rounded-lg font-medium ${colors.tailwind.primaryHover} transition-colors`}
            >
              Add
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 bg-gray-100 text-gray-500 px-4 py-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Out of Stock</span>
          </div>
        )}
      </div>
    </div>
  );
}
