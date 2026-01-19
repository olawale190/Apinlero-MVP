import { useState, useEffect } from 'react';
import { Plus, Trash2, MessageCircle, Globe, Phone, Store } from 'lucide-react';
import { supabase, type Product, type OrderItem } from '../lib/supabase';

interface NewOrderFormProps {
  onOrderCreated: () => void;
}

type Channel = 'WhatsApp' | 'Web' | 'Phone' | 'Walk-in';

export default function NewOrderForm({ onOrderCreated }: NewOrderFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [channel, setChannel] = useState<Channel>('WhatsApp');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (!error && data) {
      setProducts(data);
    }
  };

  const addItem = () => {
    if (!selectedProduct) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const newItem: OrderItem = {
      product_name: product.name,
      quantity,
      price: product.price,
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return itemsTotal + deliveryFee;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || items.length === 0) {
      alert('Please fill in customer name and add at least one item');
      return;
    }

    setIsSubmitting(true);

    const order = {
      customer_name: customerName,
      phone_number: phoneNumber,
      delivery_address: deliveryAddress,
      channel,
      items,
      delivery_fee: deliveryFee,
      total: calculateTotal(),
      status: 'Pending',
      notes,
    };

    const { error } = await supabase.from('orders').insert([order]);

    if (error) {
      alert('Error creating order: ' + error.message);
    } else {
      setCustomerName('');
      setPhoneNumber('');
      setDeliveryAddress('');
      setItems([]);
      setNotes('');
      setDeliveryFee(5);
      onOrderCreated();
    }

    setIsSubmitting(false);
  };

  const channels: { value: Channel; label: string; icon: typeof MessageCircle }[] = [
    { value: 'WhatsApp', label: 'WhatsApp', icon: MessageCircle },
    { value: 'Web', label: 'Web', icon: Globe },
    { value: 'Phone', label: 'Phone', icon: Phone },
    { value: 'Walk-in', label: 'Walk-in', icon: Store },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#1e3a5f' }}>
        New Order
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Channel
          </label>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {channels.map(ch => {
              const Icon = ch.icon;
              return (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => setChannel(ch.value)}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 transition-all ${
                    channel === ch.value
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon size={14} className="sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-medium">{ch.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="w-full px-2.5 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            className="w-full px-2.5 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Delivery Address
          </label>
          <input
            type="text"
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
            className="w-full px-2.5 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Items
          </label>
          <div className="space-y-2">
            {/* Mobile: Stack vertically */}
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                className="flex-1 px-2.5 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select product...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - £{product.price.toFixed(2)}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-16 sm:w-20 px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-2 rounded-lg text-white transition-all hover:opacity-90 flex-shrink-0"
                  style={{ backgroundColor: '#0d9488' }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-2.5 sm:p-3 space-y-1.5 sm:space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="truncate mr-2">
                      {item.product_name} x {item.quantity}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-medium">
                        £{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-2.5 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Delivery Fee (£)
          </label>
          <input
            type="number"
            step="0.01"
            value={deliveryFee}
            onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)}
            className="w-full px-2.5 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <span className="text-base sm:text-lg font-semibold" style={{ color: '#1e3a5f' }}>
              Total
            </span>
            <span className="text-xl sm:text-2xl font-bold" style={{ color: '#0d9488' }}>
              £{calculateTotal().toFixed(2)}
            </span>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 sm:py-3 rounded-lg text-white text-sm sm:text-base font-medium transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#0d9488' }}
          >
            {isSubmitting ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
