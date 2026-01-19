import { CheckCircle, Phone, MapPin, Search } from 'lucide-react';
import { shopConfig } from '../config/shop';
import { colors } from '../config/colors';

interface ConfirmationProps {
  orderId: string;
  onContinueShopping: () => void;
}

export default function Confirmation({ orderId, onContinueShopping }: ConfirmationProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-lg text-gray-600 mb-6">Your order has been placed successfully</p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <p className="text-sm text-gray-600 mb-1">Order Number</p>
            <p className="text-2xl font-bold ${colors.tailwind.primaryMainText} font-mono">
              {orderId.substring(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="border-t border-b py-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">What happens next?</h2>
            <div className="text-left space-y-3">
              <p className="text-gray-600">
                • We'll contact you shortly to confirm your order
              </p>
              <p className="text-gray-600">
                • You'll receive updates on your delivery
              </p>
              <p className="text-gray-600">
                • Have questions? Contact us anytime
              </p>
            </div>
          </div>

          <div className="bg-teal-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <Phone className="w-4 h-4" />
                <span>{shopConfig.phone}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4" />
                <span>{shopConfig.location}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onContinueShopping}
              className={`w-full ${colors.tailwind.primaryMain} text-white py-3 rounded-lg font-semibold ${colors.tailwind.primaryHover} transition-colors`}
            >
              Continue Shopping
            </button>

            <a
              href="/track"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              Track Your Order
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
