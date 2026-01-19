import { Phone, MapPin, Layers } from 'lucide-react';
import { shopConfig, platformConfig } from '../config/shop';

export default function StorefrontFooter() {
  return (
    <footer className="bg-white border-t mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-4">{shopConfig.name}</h3>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{shopConfig.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{shopConfig.location}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-4">About</h3>
            <p className="text-gray-600 text-sm">
              {shopConfig.tagline} - delivering quality African and Caribbean products to your door.
            </p>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Layers className="w-5 h-5 text-teal-600" />
            <span className="text-sm font-medium">{platformConfig.poweredByText}</span>
          </div>
          <p className="text-sm text-gray-500">
            {platformConfig.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
