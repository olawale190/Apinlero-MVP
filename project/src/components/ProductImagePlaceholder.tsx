import { Package } from 'lucide-react';

interface ProductImagePlaceholderProps {
  productName: string;
  className?: string;
}

/**
 * Placeholder component for products without images
 * Displays the product name in a styled box
 */
export default function ProductImagePlaceholder({ productName, className = '' }: ProductImagePlaceholderProps) {
  // Generate a consistent color based on product name
  const getColorFromName = (name: string) => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-yellow-400 to-yellow-600',
      'from-red-400 to-red-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600',
      'from-orange-400 to-orange-600',
      'from-cyan-400 to-cyan-600',
    ];

    // Simple hash function to get consistent color for same name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const gradientColor = getColorFromName(productName);

  return (
    <div className={`relative bg-gradient-to-br ${gradientColor} flex flex-col items-center justify-center p-4 ${className}`}>
      <Package className="text-white opacity-20 mb-2" size={48} />
      <p className="text-white font-bold text-center text-sm leading-tight px-2 drop-shadow-lg">
        {productName}
      </p>
    </div>
  );
}
