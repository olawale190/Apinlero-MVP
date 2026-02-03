// Wishlist Button Component
// Heart toggle button for adding/removing products from wishlist

import { Heart } from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WishlistButton({ productId, className = '', size = 'md' }: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId);
  };

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22
  };

  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
        isWishlisted
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500 shadow-sm'
      } ${className}`}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        size={iconSizes[size]}
        className={isWishlisted ? 'fill-current' : ''}
      />
    </button>
  );
}
