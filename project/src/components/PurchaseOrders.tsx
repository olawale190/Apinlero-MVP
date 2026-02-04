import { useState, useMemo } from 'react';
import { useBusinessContext } from '../contexts/BusinessContext';
import {
  ShoppingCart,
  AlertTriangle,
  Package,
  Download,
  Plus,
  Minus,
  Check,
  X,
  Truck,
  FileText,
  Building2,
  Phone,
  Mail,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  unit: string;
  stock_quantity: number;
  is_active: boolean;
}

interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  categories: string[];
  lead_time_days?: number;
  minimum_order?: number;
}

interface PurchaseOrderItem {
  product_id: string;
  product_name: string;
  category: string;
  unit: string;
  current_stock: number;
  reorder_quantity: number;
  unit_cost: number;
  total_cost: number;
}

interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier_name: string;
  items: PurchaseOrderItem[];
  status: 'draft' | 'pending' | 'ordered' | 'received';
  total_amount: number;
  created_at: string;
  expected_delivery?: string;
  notes?: string;
}

interface PurchaseOrdersProps {
  products: Product[];
  onProductUpdate: () => void;
}

// Default suppliers for African/Caribbean grocery stores
const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Tropical Foods Wholesale',
    contact_name: 'Mr. Adekunle',
    phone: '+44 20 7123 4567',
    email: 'orders@tropicalfoods.co.uk',
    address: '45 Commercial Road, London E1 1LA',
    categories: ['Grains', 'Flours', 'Oils', 'Canned'],
    lead_time_days: 2,
    minimum_order: 100
  },
  {
    id: 'sup-2',
    name: 'Fresh Produce Direct',
    contact_name: 'Mrs. Okonkwo',
    phone: '+44 20 7890 1234',
    email: 'supply@freshproduce.uk',
    address: '12 Market Lane, London SE1 2AB',
    categories: ['Fresh Produce', 'Vegetables', 'Fruits'],
    lead_time_days: 1,
    minimum_order: 50
  },
  {
    id: 'sup-3',
    name: 'Naija Snacks Ltd',
    contact_name: 'Chidi Emeka',
    phone: '+44 20 7456 7890',
    email: 'wholesale@naijasnacks.com',
    address: '78 Industrial Estate, Birmingham B12 0QS',
    categories: ['Snacks', 'Beverages', 'Drinks'],
    lead_time_days: 3,
    minimum_order: 75
  },
  {
    id: 'sup-4',
    name: 'African Spices Importers',
    contact_name: 'Fatima Hassan',
    phone: '+44 20 7234 5678',
    email: 'orders@africanspices.co.uk',
    address: '23 Spice Market, London E14 9PQ',
    categories: ['Spices', 'Seasonings', 'Condiments'],
    lead_time_days: 4,
    minimum_order: 50
  }
];

// Reorder thresholds based on category
const REORDER_THRESHOLDS: Record<string, { critical: number; warning: number; reorderQty: number }> = {
  'Fresh Produce': { critical: 5, warning: 15, reorderQty: 50 },
  'Vegetables': { critical: 5, warning: 15, reorderQty: 50 },
  'Fruits': { critical: 5, warning: 15, reorderQty: 50 },
  'Flours': { critical: 3, warning: 10, reorderQty: 30 },
  'Grains': { critical: 5, warning: 15, reorderQty: 40 },
  'Snacks': { critical: 5, warning: 20, reorderQty: 50 },
  'Beverages': { critical: 10, warning: 30, reorderQty: 60 },
  'Drinks': { critical: 10, warning: 30, reorderQty: 60 },
  'Oils': { critical: 5, warning: 15, reorderQty: 25 },
  'Spices': { critical: 10, warning: 25, reorderQty: 30 },
  'Canned': { critical: 10, warning: 25, reorderQty: 40 },
  'default': { critical: 5, warning: 20, reorderQty: 30 }
};

const getThreshold = (category: string) => {
  return REORDER_THRESHOLDS[category] || REORDER_THRESHOLDS['default'];
};

const getStockStatus = (product: Product): 'critical' | 'warning' | 'ok' => {
  const threshold = getThreshold(product.category);
  if (product.stock_quantity <= threshold.critical) return 'critical';
  if (product.stock_quantity <= threshold.warning) return 'warning';
  return 'ok';
};

export default function PurchaseOrders({ products, onProductUpdate }: PurchaseOrdersProps) {
  const { business } = useBusinessContext();
  const [suppliers] = useState<Supplier[]>(DEFAULT_SUPPLIERS);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [showSupplierSelect, setShowSupplierSelect] = useState(false);
  const [showOrderPreview, setShowOrderPreview] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [savedOrders, setSavedOrders] = useState<PurchaseOrder[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Filter products needing reorder
  const criticalItems = useMemo(() =>
    products.filter(p => p.is_active && getStockStatus(p) === 'critical'),
    [products]
  );

  const warningItems = useMemo(() =>
    products.filter(p => p.is_active && getStockStatus(p) === 'warning'),
    [products]
  );

  // Calculate suggested order for a product
  const getSuggestedOrder = (product: Product): number => {
    const threshold = getThreshold(product.category);
    return threshold.reorderQty;
  };

  // Get estimated cost (using 60% of retail as wholesale estimate)
  const getEstimatedCost = (product: Product, quantity: number): number => {
    const wholesaleRate = 0.6;
    return Math.round((product.price / 100) * wholesaleRate * quantity * 100) / 100;
  };

  // Add product to order
  const addToOrder = (product: Product) => {
    const existingItem = orderItems.find(item => item.product_id === product.id);
    if (existingItem) {
      updateOrderQuantity(product.id, existingItem.reorder_quantity + getSuggestedOrder(product));
    } else {
      const suggestedQty = getSuggestedOrder(product);
      const unitCost = getEstimatedCost(product, 1);
      setOrderItems([...orderItems, {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        unit: product.unit,
        current_stock: product.stock_quantity,
        reorder_quantity: suggestedQty,
        unit_cost: unitCost,
        total_cost: unitCost * suggestedQty
      }]);
    }
  };

  // Update quantity in order
  const updateOrderQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(productId);
      return;
    }
    setOrderItems(orderItems.map(item =>
      item.product_id === productId
        ? { ...item, reorder_quantity: quantity, total_cost: item.unit_cost * quantity }
        : item
    ));
  };

  // Remove from order
  const removeFromOrder = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.product_id !== productId));
  };

  // Add all critical items to order
  const addAllCriticalItems = () => {
    const newItems: PurchaseOrderItem[] = [];
    criticalItems.forEach(product => {
      if (!orderItems.find(item => item.product_id === product.id)) {
        const suggestedQty = getSuggestedOrder(product);
        const unitCost = getEstimatedCost(product, 1);
        newItems.push({
          product_id: product.id,
          product_name: product.name,
          category: product.category,
          unit: product.unit,
          current_stock: product.stock_quantity,
          reorder_quantity: suggestedQty,
          unit_cost: unitCost,
          total_cost: unitCost * suggestedQty
        });
      }
    });
    setOrderItems([...orderItems, ...newItems]);
  };

  // Calculate order total
  const orderTotal = useMemo(() =>
    orderItems.reduce((sum, item) => sum + item.total_cost, 0),
    [orderItems]
  );

  // Generate purchase order
  const generatePurchaseOrder = () => {
    if (!selectedSupplier || orderItems.length === 0) return;

    setGenerating(true);

    setTimeout(() => {
      const newOrder: PurchaseOrder = {
        id: `PO-${Date.now().toString(36).toUpperCase()}`,
        supplier_id: selectedSupplier.id,
        supplier_name: selectedSupplier.name,
        items: [...orderItems],
        status: 'draft',
        total_amount: orderTotal,
        created_at: new Date().toISOString(),
        expected_delivery: selectedSupplier.lead_time_days
          ? new Date(Date.now() + selectedSupplier.lead_time_days * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
        notes: orderNotes
      };

      setSavedOrders([newOrder, ...savedOrders]);
      setOrderItems([]);
      setSelectedSupplier(null);
      setOrderNotes('');
      setShowOrderPreview(false);
      setGenerating(false);
    }, 500);
  };

  // Export order as text for WhatsApp/Email
  const exportOrderText = (order: PurchaseOrder): string => {
    const supplier = suppliers.find(s => s.id === order.supplier_id);
    const date = new Date(order.created_at).toLocaleDateString('en-GB');
    const expectedDate = order.expected_delivery
      ? new Date(order.expected_delivery).toLocaleDateString('en-GB')
      : 'TBC';

    let text = `PURCHASE ORDER - ${order.id}\n`;
    text += `Date: ${date}\n`;
    text += `Expected Delivery: ${expectedDate}\n\n`;
    text += `TO: ${order.supplier_name}\n`;
    if (supplier) {
      if (supplier.contact_name) text += `Attn: ${supplier.contact_name}\n`;
      if (supplier.phone) text += `Tel: ${supplier.phone}\n`;
    }
    text += `\n${'='.repeat(40)}\nORDER ITEMS:\n${'='.repeat(40)}\n\n`;

    order.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.product_name}\n`;
      text += `   Qty: ${item.reorder_quantity} ${item.unit}\n`;
      text += `   Est. Cost: £${item.total_cost.toFixed(2)}\n\n`;
    });

    text += `${'='.repeat(40)}\n`;
    text += `ESTIMATED TOTAL: £${order.total_amount.toFixed(2)}\n`;
    text += `${'='.repeat(40)}\n`;

    if (order.notes) {
      text += `\nNOTES: ${order.notes}\n`;
    }

    text += `\nFrom: ${business?.name || 'Apinlero Store'}`;

    return text;
  };

  // Copy order to clipboard
  const copyOrderToClipboard = async (order: PurchaseOrder) => {
    const text = exportOrderText(order);
    await navigator.clipboard.writeText(text);
    alert('Order copied to clipboard! You can now paste it into WhatsApp or Email.');
  };

  // Download order as text file
  const downloadOrder = (order: PurchaseOrder) => {
    const text = exportOrderText(order);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${order.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Update order status
  const updateOrderStatus = (orderId: string, status: PurchaseOrder['status']) => {
    setSavedOrders(savedOrders.map(order =>
      order.id === orderId ? { ...order, status } : order
    ));

    if (status === 'received') {
      alert('Order marked as received. Remember to update your inventory with the received stock!');
    }
  };

  const ProductRow = ({ product, status }: { product: Product; status: 'critical' | 'warning' }) => {
    const isInOrder = orderItems.find(item => item.product_id === product.id);
    const suggestedQty = getSuggestedOrder(product);
    const estimatedCost = getEstimatedCost(product, suggestedQty);

    return (
      <div className={`flex items-center justify-between p-3 rounded-lg border ${
        status === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              status === 'critical' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
            }`}>
              {product.stock_quantity} left
            </span>
            <h4 className="font-medium text-gray-800 truncate">{product.name}</h4>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{product.category} • Suggest: {suggestedQty} {product.unit}</p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <span className="text-sm font-medium text-gray-600">~£{estimatedCost.toFixed(2)}</span>
          {isInOrder ? (
            <button
              onClick={() => removeFromOrder(product.id)}
              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
              title="In order - click to remove"
            >
              <Check size={16} />
            </button>
          ) : (
            <button
              onClick={() => addToOrder(product)}
              className="p-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition"
              title="Add to order"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: '#1e3a5f' }}>
              <ShoppingCart size={24} />
              Purchase Orders
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Generate orders for low stock items
            </p>
          </div>

          {orderItems.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">{orderItems.length} items</p>
                <p className="text-lg font-bold" style={{ color: '#0d9488' }}>£{orderTotal.toFixed(2)}</p>
              </div>
              <button
                onClick={() => setShowSupplierSelect(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition flex items-center gap-2"
              >
                <FileText size={18} />
                <span className="hidden sm:inline">Create Order</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle size={18} />
              <span className="text-2xl font-bold">{criticalItems.length}</span>
            </div>
            <p className="text-xs text-red-600 mt-1">Critical Stock</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700">
              <Clock size={18} />
              <span className="text-2xl font-bold">{warningItems.length}</span>
            </div>
            <p className="text-xs text-amber-600 mt-1">Low Stock</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700">
              <Package size={18} />
              <span className="text-2xl font-bold">{orderItems.length}</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">In Order</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <Truck size={18} />
              <span className="text-2xl font-bold">{savedOrders.filter(o => o.status === 'ordered').length}</span>
            </div>
            <p className="text-xs text-green-600 mt-1">Pending Delivery</p>
          </div>
        </div>

        {/* Critical Items */}
        {criticalItems.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle size={16} />
                Critical Stock - Order Now
              </h3>
              <button
                onClick={addAllCriticalItems}
                className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
              >
                Add All to Order
              </button>
            </div>
            <div className="space-y-2">
              {criticalItems.map(product => (
                <ProductRow key={product.id} product={product} status="critical" />
              ))}
            </div>
          </div>
        )}

        {/* Warning Items */}
        {warningItems.length > 0 && (
          <div>
            <h3 className="font-semibold text-amber-700 flex items-center gap-2 mb-2">
              <Clock size={16} />
              Low Stock Warning
            </h3>
            <div className="space-y-2">
              {warningItems.map(product => (
                <ProductRow key={product.id} product={product} status="warning" />
              ))}
            </div>
          </div>
        )}

        {criticalItems.length === 0 && warningItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package size={48} className="mx-auto mb-2 opacity-50" />
            <p>All products are well stocked!</p>
          </div>
        )}
      </div>

      {/* Current Order Items */}
      {orderItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="font-bold text-lg mb-4" style={{ color: '#1e3a5f' }}>
            Current Order ({orderItems.length} items)
          </h3>
          <div className="space-y-3">
            {orderItems.map(item => (
              <div key={item.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-800">{item.product_name}</h4>
                  <p className="text-xs text-gray-500">
                    Current stock: {item.current_stock} • £{item.unit_cost.toFixed(2)}/{item.unit}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateOrderQuantity(item.product_id, item.reorder_quantity - 5)}
                      className="p-1.5 bg-gray-200 rounded hover:bg-gray-300 transition"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={item.reorder_quantity}
                      onChange={(e) => updateOrderQuantity(item.product_id, parseInt(e.target.value) || 0)}
                      className="w-16 text-center border rounded px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => updateOrderQuantity(item.product_id, item.reorder_quantity + 5)}
                      className="p-1.5 bg-gray-200 rounded hover:bg-gray-300 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-sm font-semibold w-20 text-right" style={{ color: '#0d9488' }}>
                    £{item.total_cost.toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeFromOrder(item.product_id)}
                    className="p-1.5 text-red-500 hover:bg-red-100 rounded transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <span className="font-semibold text-gray-700">Estimated Total:</span>
            <span className="text-xl font-bold" style={{ color: '#0d9488' }}>
              £{orderTotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Saved Orders History */}
      {savedOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="font-bold text-lg mb-4" style={{ color: '#1e3a5f' }}>
            Order History
          </h3>
          <div className="space-y-3">
            {savedOrders.map(order => {
              const isExpanded = expandedOrderId === order.id;
              const statusColors = {
                draft: 'bg-gray-100 text-gray-700',
                pending: 'bg-yellow-100 text-yellow-800',
                ordered: 'bg-blue-100 text-blue-800',
                received: 'bg-green-100 text-green-800'
              };

              return (
                <div key={order.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[order.status]}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{order.id}</p>
                        <p className="text-xs text-gray-500">
                          {order.supplier_name} • {new Date(order.created_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold" style={{ color: '#0d9488' }}>
                        £{order.total_amount.toFixed(2)}
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50 p-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Order Items</h4>
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.product_name} x {item.reorder_quantity}</span>
                                <span>£{item.total_cost.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Supplier</h4>
                          <p className="text-sm">{order.supplier_name}</p>
                          {order.expected_delivery && (
                            <p className="text-sm text-gray-500">
                              Expected: {new Date(order.expected_delivery).toLocaleDateString('en-GB')}
                            </p>
                          )}
                          {order.notes && (
                            <p className="text-sm text-gray-500 mt-2">Notes: {order.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-3 border-t">
                        <button
                          onClick={() => copyOrderToClipboard(order)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition"
                        >
                          <Mail size={14} />
                          Copy for WhatsApp/Email
                        </button>
                        <button
                          onClick={() => downloadOrder(order)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition"
                        >
                          <Download size={14} />
                          Download
                        </button>
                        {order.status === 'draft' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ordered')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-200 transition"
                          >
                            <Truck size={14} />
                            Mark as Ordered
                          </button>
                        )}
                        {order.status === 'ordered' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'received')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition"
                          >
                            <Check size={14} />
                            Mark as Received
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supplier Selection Modal */}
      {showSupplierSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg" style={{ color: '#1e3a5f' }}>
                <Building2 className="inline-block mr-2 mb-1" size={20} />
                Select Supplier
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose a supplier for your order
              </p>
            </div>

            <div className="p-4 space-y-3">
              {suppliers.map(supplier => {
                const matchingCategories = orderItems.filter(item =>
                  supplier.categories.some(cat =>
                    item.category.toLowerCase().includes(cat.toLowerCase()) ||
                    cat.toLowerCase().includes(item.category.toLowerCase())
                  )
                ).length;

                return (
                  <button
                    key={supplier.id}
                    onClick={() => {
                      setSelectedSupplier(supplier);
                      setShowSupplierSelect(false);
                      setShowOrderPreview(true);
                    }}
                    className={`w-full p-4 text-left border rounded-lg hover:border-teal-500 transition ${
                      matchingCategories > 0 ? 'border-teal-200 bg-teal-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">{supplier.name}</h4>
                        {supplier.contact_name && (
                          <p className="text-sm text-gray-600">{supplier.contact_name}</p>
                        )}
                      </div>
                      {matchingCategories > 0 && (
                        <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs font-medium">
                          {matchingCategories} items match
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {supplier.categories.map(cat => (
                        <span key={cat} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {cat}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {supplier.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} />
                          {supplier.phone}
                        </span>
                      )}
                      {supplier.lead_time_days && (
                        <span className="flex items-center gap-1">
                          <Truck size={12} />
                          {supplier.lead_time_days} day delivery
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowSupplierSelect(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Preview Modal */}
      {showOrderPreview && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg" style={{ color: '#1e3a5f' }}>
                <FileText className="inline-block mr-2 mb-1" size={20} />
                Order Preview
              </h3>
            </div>

            <div className="p-4 space-y-4">
              {/* Supplier Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Supplier</h4>
                <p className="font-medium">{selectedSupplier.name}</p>
                {selectedSupplier.contact_name && (
                  <p className="text-sm text-gray-600">Attn: {selectedSupplier.contact_name}</p>
                )}
                {selectedSupplier.phone && (
                  <p className="text-sm text-gray-600">{selectedSupplier.phone}</p>
                )}
                {selectedSupplier.lead_time_days && (
                  <p className="text-sm text-teal-600 mt-1">
                    Expected delivery: {new Date(Date.now() + selectedSupplier.lead_time_days * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}
                  </p>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {orderItems.map(item => (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <span>{item.product_name} x {item.reorder_quantity} {item.unit}</span>
                      <span className="font-medium">£{item.total_cost.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Estimated Total</span>
                    <span style={{ color: '#0d9488' }}>£{orderTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Notes (Optional)
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Any special instructions or notes..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 p-4 border-t bg-gray-50">
              <button
                onClick={generatePurchaseOrder}
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Generate Order
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowOrderPreview(false);
                  setSelectedSupplier(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
