import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Package, QrCode, Plus, Minus, Search, AlertTriangle, Camera, Edit3, Tag, Check, X, Calendar, Clock, Barcode, Trash2, FolderOpen, Mail, Image, Upload, Loader2, Database } from 'lucide-react';
import ProductQRCode from './ProductQRCode';
import QRScanner from './QRScanner';
import CategoryManager from './CategoryManager';
import { triggerLowStockAlert, triggerExpiryAlert, isN8nConfigured } from '../lib/n8n';
import { uploadAndTrack, BUCKETS, getPublicUrl } from '../lib/storage';
import StorageDiagnosticsPanel from './StorageDiagnostics';

interface BulkPriceTier {
  minQty: number;
  maxQty: number | null;
  price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  unit: string;
  stock_quantity: number;
  is_active: boolean;
  sku?: string;
  barcode?: string;
  expiry_date?: string;
  batch_number?: string;
  bulk_pricing?: BulkPriceTier[];
  image_url?: string;
}

interface NewProductForm {
  name: string;
  price: string;
  category: string;
  unit: string;
  stock_quantity: string;
  barcode: string;
  expiry_date: string;
  batch_number: string;
  image_url: string;
}

// Helper to check expiry status
const getExpiryStatus = (expiryDate: string | undefined): 'ok' | 'warning' | 'critical' | 'expired' | null => {
  if (!expiryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 3) return 'critical';
  if (daysUntilExpiry <= 7) return 'warning';
  return 'ok';
};

const getDaysUntilExpiry = (expiryDate: string | undefined): number | null => {
  if (!expiryDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

interface InventoryManagerProps {
  products: Product[];
  onProductUpdate: () => void;
}

// Default bulk pricing tiers for wholesale
const defaultBulkTiers: BulkPriceTier[] = [
  { minQty: 1, maxQty: 10, price: 0 }, // Base price (will be set from product)
  { minQty: 11, maxQty: 50, price: 0 }, // 10% off
  { minQty: 51, maxQty: null, price: 0 }, // 15% off
];

export default function InventoryManager({ products: initialProducts, onProductUpdate }: InventoryManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<Product | null>(null);
  const [updatingStock, setUpdatingStock] = useState<string | null>(null);

  // Price editing states
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [showBulkPricing, setShowBulkPricing] = useState<string | null>(null);
  const [bulkTiers, setBulkTiers] = useState<BulkPriceTier[]>([]);
  const [savingPrice, setSavingPrice] = useState(false);

  // New product form for unknown barcodes or manual add
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [isManualAdd, setIsManualAdd] = useState(false);
  const [newProductForm, setNewProductForm] = useState<NewProductForm>({
    name: '',
    price: '',
    category: '',
    unit: 'each',
    stock_quantity: '1',
    barcode: '',
    expiry_date: '',
    batch_number: '',
    image_url: ''
  });
  const [savingProduct, setSavingProduct] = useState(false);

  // Edit product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<NewProductForm>({
    name: '',
    price: '',
    category: '',
    unit: 'each',
    stock_quantity: '1',
    barcode: '',
    expiry_date: '',
    batch_number: '',
    image_url: ''
  });

  // Delete confirmation state
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Category manager state
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categoriesFromDb, setCategoriesFromDb] = useState<string[]>([]);

  // Email alert state
  const [sendingAlert, setSendingAlert] = useState<string | null>(null);
  const [alertSent, setAlertSent] = useState<string | null>(null);

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Storage diagnostics state
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Handle sending low stock alert
  const handleSendLowStockAlert = async (product: Product) => {
    setSendingAlert(product.id);
    const result = await triggerLowStockAlert(product.id, product.name, product.stock_quantity);
    if (result.success) {
      setAlertSent(product.id);
      setTimeout(() => setAlertSent(null), 3000);
    } else {
      alert(result.error || 'Failed to send alert');
    }
    setSendingAlert(null);
  };

  // Handle sending expiry alert
  const handleSendExpiryAlert = async (product: Product) => {
    if (!product.expiry_date) return;
    const days = getDaysUntilExpiry(product.expiry_date);
    if (days === null) return;

    setSendingAlert(product.id);
    const result = await triggerExpiryAlert(product.id, product.name, product.expiry_date, days);
    if (result.success) {
      setAlertSent(product.id);
      setTimeout(() => setAlertSent(null), 3000);
    } else {
      alert(result.error || 'Failed to send alert');
    }
    setSendingAlert(null);
  };

  // Handle image selection for new product
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditImagePreview(reader.result as string);
      } else {
        setImagePreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setUploadingImage(true);
    try {
      const result = await uploadAndTrack(BUCKETS.PRODUCTS, file, {
        folder: 'catalog',
        source: 'web',
        metadata: { uploadedFrom: 'inventory-manager' }
      });

      if (result.success && result.url) {
        if (isEdit) {
          setEditForm(prev => ({ ...prev, image_url: result.url || '' }));
        } else {
          setNewProductForm(prev => ({ ...prev, image_url: result.url || '' }));
        }
      } else {
        alert('Failed to upload image: ' + (result.error || 'Unknown error'));
        if (isEdit) {
          setEditImagePreview(null);
        } else {
          setImagePreview(null);
        }
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    }
    setUploadingImage(false);
  };

  // Remove image
  const handleRemoveImage = (isEdit: boolean = false) => {
    if (isEdit) {
      setEditImagePreview(null);
      setEditForm(prev => ({ ...prev, image_url: '' }));
      if (editFileInputRef.current) {
        editFileInputRef.current.value = '';
      }
    } else {
      setImagePreview(null);
      setNewProductForm(prev => ({ ...prev, image_url: '' }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Fetch categories from database
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .eq('store_id', 'ishas-treat')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setCategoriesFromDb(data.map(c => c.name));
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle category manager close - refresh categories
  const handleCategoryManagerClose = () => {
    setShowCategoryManager(false);
  };

  const handleCategoriesChange = () => {
    fetchCategories();
    onProductUpdate(); // Refresh products in case category names changed
  };

  // Get products expiring soon
  const expiringProducts = products.filter(p => {
    const status = getExpiryStatus(p.expiry_date);
    return status === 'warning' || status === 'critical' || status === 'expired';
  });

  // Calculate bulk price based on quantity
  const getBulkPrice = (product: Product, quantity: number): number => {
    if (!product.bulk_pricing || product.bulk_pricing.length === 0) {
      return product.price;
    }

    const tier = product.bulk_pricing.find(t =>
      quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty)
    );

    return tier ? tier.price : product.price;
  };

  // Update product price
  const updatePrice = async (productId: string, price: number) => {
    setSavingPrice(true);
    const { error } = await supabase
      .from('products')
      .update({ price })
      .eq('id', productId);

    if (!error) {
      setProducts(products.map(p =>
        p.id === productId ? { ...p, price } : p
      ));
      if (scanResult?.id === productId) {
        setScanResult({ ...scanResult, price });
      }
      onProductUpdate();
    }
    setSavingPrice(false);
    setEditingPrice(null);
    setNewPrice('');
  };

  // Save bulk pricing tiers
  const saveBulkPricing = async (productId: string) => {
    setSavingPrice(true);
    const { error } = await supabase
      .from('products')
      .update({ bulk_pricing: bulkTiers })
      .eq('id', productId);

    if (!error) {
      setProducts(products.map(p =>
        p.id === productId ? { ...p, bulk_pricing: bulkTiers } : p
      ));
      onProductUpdate();
    }
    setSavingPrice(false);
    setShowBulkPricing(null);
  };

  // Initialize bulk tiers for a product
  const initBulkTiers = (product: Product) => {
    if (product.bulk_pricing && product.bulk_pricing.length > 0) {
      setBulkTiers(product.bulk_pricing);
    } else {
      // Create default tiers based on product price
      setBulkTiers([
        { minQty: 1, maxQty: 10, price: product.price },
        { minQty: 11, maxQty: 50, price: Number((product.price * 0.9).toFixed(2)) },
        { minQty: 51, maxQty: null, price: Number((product.price * 0.85).toFixed(2)) },
      ]);
    }
    setShowBulkPricing(product.id);
  };

  const updateStock = async (productId: string, change: number) => {
    setUpdatingStock(productId);
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newQuantity = Math.max(0, product.stock_quantity + change);

    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: newQuantity })
      .eq('id', productId);

    if (!error) {
      setProducts(products.map(p =>
        p.id === productId ? { ...p, stock_quantity: newQuantity } : p
      ));
      onProductUpdate();
    }
    setUpdatingStock(null);
  };

  const handleShowQR = (product: Product) => {
    setSelectedProduct(product);
    setShowQRModal(true);
  };

  const handleScan = (data: string, format: string) => {
    setShowScanner(false);

    // Check if it's a QR code with JSON data (our own QR codes)
    if (format === 'qr_code') {
      try {
        const scannedData = JSON.parse(data);
        const foundProduct = products.find(p => p.id === scannedData.id);
        if (foundProduct) {
          setScanResult(foundProduct);
          return;
        }
      } catch {
        // Not JSON, might be a SKU
      }

      // Try to find by SKU
      const foundProduct = products.find(p =>
        p.sku === data ||
        `APL-${p.category?.toUpperCase().slice(0, 3) || 'GEN'}-${p.id.slice(0, 6).toUpperCase()}` === data
      );
      if (foundProduct) {
        setScanResult(foundProduct);
        return;
      }
    }

    // For standard barcodes (EAN, UPC, etc.), search by barcode field
    const foundProduct = products.find(p => p.barcode === data);
    if (foundProduct) {
      setScanResult(foundProduct);
      return;
    }

    // Product not found - show add new product form
    setScannedBarcode(data);
    setImagePreview(null);
    setNewProductForm({
      name: '',
      price: '',
      category: '',
      unit: 'each',
      stock_quantity: '1',
      barcode: data,
      expiry_date: '',
      batch_number: '',
      image_url: ''
    });
    setShowNewProductForm(true);
  };

  // Save new product from barcode scan or manual add
  const saveNewProduct = async () => {
    if (!newProductForm.name || !newProductForm.price) {
      alert('Please enter product name and price');
      return;
    }

    setSavingProduct(true);

    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: newProductForm.name,
        price: parseFloat(newProductForm.price),
        category: newProductForm.category || 'General',
        unit: newProductForm.unit,
        stock_quantity: parseInt(newProductForm.stock_quantity) || 1,
        barcode: newProductForm.barcode || null,
        expiry_date: newProductForm.expiry_date || null,
        batch_number: newProductForm.batch_number || null,
        image_url: newProductForm.image_url || null,
        is_active: true
      }])
      .select()
      .single();

    if (!error && data) {
      setProducts([...products, data]);
      if (!isManualAdd) {
        setScanResult(data);
      }
      setShowNewProductForm(false);
      setIsManualAdd(false);
      setImagePreview(null);
      setNewProductForm({
        name: '',
        price: '',
        category: '',
        unit: 'each',
        stock_quantity: '1',
        barcode: '',
        expiry_date: '',
        batch_number: '',
        image_url: ''
      });
      onProductUpdate();
    } else {
      alert('Error saving product: ' + (error?.message || 'Unknown error'));
    }

    setSavingProduct(false);
  };

  // Open manual add product form
  const openManualAddForm = () => {
    setIsManualAdd(true);
    setScannedBarcode('');
    setImagePreview(null);
    setNewProductForm({
      name: '',
      price: '',
      category: '',
      unit: 'each',
      stock_quantity: '1',
      barcode: '',
      expiry_date: '',
      batch_number: '',
      image_url: ''
    });
    setShowNewProductForm(true);
  };

  // Open edit product modal
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditImagePreview(product.image_url || null);
    setEditForm({
      name: product.name,
      price: product.price.toString(),
      category: product.category || '',
      unit: product.unit || 'each',
      stock_quantity: product.stock_quantity.toString(),
      barcode: product.barcode || '',
      expiry_date: product.expiry_date || '',
      batch_number: product.batch_number || '',
      image_url: product.image_url || ''
    });
    setShowEditModal(true);
  };

  // Save edited product
  const saveEditedProduct = async () => {
    if (!editingProduct || !editForm.name || !editForm.price) {
      alert('Please enter product name and price');
      return;
    }

    setSavingProduct(true);

    const { error } = await supabase
      .from('products')
      .update({
        name: editForm.name,
        price: parseFloat(editForm.price),
        category: editForm.category || 'General',
        unit: editForm.unit,
        stock_quantity: parseInt(editForm.stock_quantity) || 0,
        barcode: editForm.barcode || null,
        expiry_date: editForm.expiry_date || null,
        batch_number: editForm.batch_number || null,
        image_url: editForm.image_url || null
      })
      .eq('id', editingProduct.id);

    if (!error) {
      setProducts(products.map(p =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: editForm.name,
              price: parseFloat(editForm.price),
              category: editForm.category || 'General',
              unit: editForm.unit,
              stock_quantity: parseInt(editForm.stock_quantity) || 0,
              barcode: editForm.barcode || undefined,
              expiry_date: editForm.expiry_date || undefined,
              batch_number: editForm.batch_number || undefined,
              image_url: editForm.image_url || undefined
            }
          : p
      ));
      setShowEditModal(false);
      setEditingProduct(null);
      setEditImagePreview(null);
      onProductUpdate();
    } else {
      alert('Error updating product: ' + (error?.message || 'Unknown error'));
    }

    setSavingProduct(false);
  };

  // Delete product (soft delete)
  const deleteProduct = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', deletingProduct.id);

    if (!error) {
      setProducts(products.filter(p => p.id !== deletingProduct.id));
      setShowDeleteConfirm(false);
      setDeletingProduct(null);
      onProductUpdate();
    } else {
      alert('Error deleting product: ' + (error?.message || 'Unknown error'));
    }

    setIsDeleting(false);
  };

  // Open delete confirmation
  const confirmDelete = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteConfirm(true);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(p => p.stock_quantity <= 5 && p.is_active);

  return (
    <div className="space-y-4">
      {/* Expiry Alert */}
      {expiringProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-red-800">
              <Clock size={20} />
              <h3 className="font-semibold">Expiry Alert</h3>
            </div>
            {isN8nConfigured() && (
              <button
                onClick={() => expiringProducts.forEach(p => handleSendExpiryAlert(p))}
                disabled={sendingAlert !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                <Mail size={14} />
                Email All Alerts
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {expiringProducts.map(product => {
              const status = getExpiryStatus(product.expiry_date);
              const days = getDaysUntilExpiry(product.expiry_date);
              return (
                <div key={product.id} className="flex items-center gap-1">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      status === 'expired' ? 'bg-red-200 text-red-900 font-bold' :
                      status === 'critical' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {product.name} ({status === 'expired' ? 'EXPIRED' : `${days} days left`})
                  </span>
                  {isN8nConfigured() && (
                    <button
                      onClick={() => handleSendExpiryAlert(product)}
                      disabled={sendingAlert === product.id}
                      className="p-1 bg-red-100 hover:bg-red-200 rounded transition disabled:opacity-50"
                      title="Send expiry alert email"
                    >
                      {alertSent === product.id ? (
                        <Check size={14} className="text-green-600" />
                      ) : sendingAlert === product.id ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <Mail size={14} className="text-red-600" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle size={20} />
              <h3 className="font-semibold">Low Stock Alert</h3>
            </div>
            {isN8nConfigured() && (
              <button
                onClick={() => lowStockProducts.forEach(p => handleSendLowStockAlert(p))}
                disabled={sendingAlert !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition disabled:opacity-50"
              >
                <Mail size={14} />
                Email All Alerts
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map(product => (
              <div key={product.id} className="flex items-center gap-1">
                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm">
                  {product.name} ({product.stock_quantity} left)
                </span>
                {isN8nConfigured() && (
                  <button
                    onClick={() => handleSendLowStockAlert(product)}
                    disabled={sendingAlert === product.id}
                    className="p-1 bg-amber-100 hover:bg-amber-200 rounded transition disabled:opacity-50"
                    title="Send low stock alert email"
                  >
                    {alertSent === product.id ? (
                      <Check size={14} className="text-green-600" />
                    ) : sendingAlert === product.id ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <Mail size={14} className="text-amber-600" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Inventory Card */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#1e3a5f' }}>
            <Package className="inline-block mr-2 mb-1" size={24} />
            Inventory Manager
          </h2>

          {/* Search and Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <button
              onClick={openManualAddForm}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
              title="Add Product"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Product</span>
            </button>
            <button
              onClick={() => setShowCategoryManager(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              title="Manage Categories"
            >
              <FolderOpen size={18} />
              <span className="hidden sm:inline">Categories</span>
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
              title="Scan Barcode"
            >
              <Barcode size={18} />
              <span className="hidden sm:inline">Scan</span>
            </button>
            <button
              onClick={() => setShowDiagnostics(true)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              title="Storage Diagnostics - Check if image uploads are configured"
            >
              <Database size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
            const isLowStock = product.stock_quantity <= 5;
            const isOutOfStock = product.stock_quantity === 0;

            return (
              <div
                key={product.id}
                className={`border rounded-lg overflow-hidden ${
                  isOutOfStock ? 'bg-red-50 border-red-200' :
                  isLowStock ? 'bg-amber-50 border-amber-200' :
                  'bg-white border-gray-200'
                }`}
              >
                {/* Product Image */}
                {product.image_url && (
                  <div className="relative h-32 bg-gray-100">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">OUT OF STOCK</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        title="Edit Product"
                      >
                        <Edit3 size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => confirmDelete(product)}
                        className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition"
                        title="Delete Product"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                      <button
                        onClick={() => handleShowQR(product)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                        title="Generate QR Code"
                      >
                        <QrCode size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold" style={{ color: '#0d9488' }}>
                      £{product.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">per {product.unit}</p>
                  </div>

                  {/* Stock Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateStock(product.id, -1)}
                      disabled={updatingStock === product.id || product.stock_quantity === 0}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
                    >
                      <Minus size={16} />
                    </button>
                    <span className={`w-12 text-center font-bold ${
                      isOutOfStock ? 'text-red-600' :
                      isLowStock ? 'text-amber-600' :
                      'text-gray-800'
                    }`}>
                      {product.stock_quantity}
                    </span>
                    <button
                      onClick={() => updateStock(product.id, 1)}
                      disabled={updatingStock === product.id}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {isOutOfStock && !product.image_url && (
                  <p className="text-xs text-red-600 font-medium mt-2">Out of Stock</p>
                )}
                {isLowStock && !isOutOfStock && (
                  <p className="text-xs text-amber-600 font-medium mt-2">Low Stock</p>
                )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedProduct && (
        <ProductQRCode
          product={selectedProduct}
          onClose={() => {
            setShowQRModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* QR Scanner */}
      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Scan Result Modal */}
      {scanResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg" style={{ color: '#1e3a5f' }}>
                Product Found
              </h3>
            </div>

            <div className="p-6">
              <h4 className="font-semibold text-xl text-gray-800 mb-1">{scanResult.name}</h4>
              <p className="text-sm text-gray-500 mb-4">{scanResult.category}</p>

              {/* Price Section with Edit */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  {editingPrice === scanResult.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold" style={{ color: '#0d9488' }}>£</span>
                      <input
                        type="number"
                        step="0.01"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-24 px-2 py-1 border rounded text-lg font-bold"
                        style={{ color: '#0d9488' }}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          const price = parseFloat(newPrice);
                          if (!isNaN(price) && price > 0) {
                            updatePrice(scanResult.id, price);
                          }
                        }}
                        disabled={savingPrice}
                        className="p-1 bg-green-100 hover:bg-green-200 rounded transition"
                      >
                        <Check size={18} className="text-green-600" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingPrice(null);
                          setNewPrice('');
                        }}
                        className="p-1 bg-red-100 hover:bg-red-200 rounded transition"
                      >
                        <X size={18} className="text-red-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold" style={{ color: '#0d9488' }}>
                        £{scanResult.price.toFixed(2)}
                      </p>
                      <button
                        onClick={() => {
                          setEditingPrice(scanResult.id);
                          setNewPrice(scanResult.price.toString());
                        }}
                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition"
                        title="Edit Price"
                      >
                        <Edit3 size={16} className="text-gray-600" />
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">per {scanResult.unit}</p>
                </div>

                <div className={`text-center px-4 py-2 rounded-lg ${
                  scanResult.stock_quantity === 0 ? 'bg-red-100 text-red-800' :
                  scanResult.stock_quantity <= 5 ? 'bg-amber-100 text-amber-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  <p className="text-2xl font-bold">{scanResult.stock_quantity}</p>
                  <p className="text-xs">in stock</p>
                </div>
              </div>

              {/* Bulk Pricing Display */}
              {scanResult.bulk_pricing && scanResult.bulk_pricing.length > 0 && (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 text-purple-800 mb-2">
                    <Tag size={16} />
                    <span className="font-semibold text-sm">Bulk Pricing</span>
                  </div>
                  <div className="space-y-1">
                    {scanResult.bulk_pricing.map((tier, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {tier.maxQty ? `${tier.minQty}-${tier.maxQty} units` : `${tier.minQty}+ units`}
                        </span>
                        <span className="font-semibold text-purple-700">£{tier.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bulk Pricing Button */}
              <button
                onClick={() => initBulkTiers(scanResult)}
                className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition"
              >
                <Tag size={18} />
                {scanResult.bulk_pricing ? 'Edit Bulk Pricing' : 'Set Bulk Pricing'}
              </button>

              {/* Quick Stock Adjust */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => {
                    updateStock(scanResult.id, -1);
                    setScanResult({...scanResult, stock_quantity: Math.max(0, scanResult.stock_quantity - 1)});
                  }}
                  disabled={updatingStock === scanResult.id || scanResult.stock_quantity === 0}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
                >
                  <Minus size={24} />
                </button>
                <span className="text-3xl font-bold w-16 text-center">{scanResult.stock_quantity}</span>
                <button
                  onClick={() => {
                    updateStock(scanResult.id, 1);
                    setScanResult({...scanResult, stock_quantity: scanResult.stock_quantity + 1});
                  }}
                  disabled={updatingStock === scanResult.id}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowScanner(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition"
              >
                <Camera size={18} />
                Scan Another
              </button>
              <button
                onClick={() => setScanResult(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Pricing Modal */}
      {showBulkPricing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg" style={{ color: '#1e3a5f' }}>
                <Tag className="inline-block mr-2 mb-1" size={20} />
                Bulk Pricing Tiers
              </h3>
              <p className="text-sm text-gray-500 mt-1">Set different prices for different quantities</p>
            </div>

            <div className="p-6 space-y-4">
              {bulkTiers.map((tier, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="number"
                        value={tier.minQty}
                        onChange={(e) => {
                          const newTiers = [...bulkTiers];
                          newTiers[index].minQty = parseInt(e.target.value) || 1;
                          setBulkTiers(newTiers);
                        }}
                        className="w-16 px-2 py-1 border rounded text-center"
                        min="1"
                      />
                      <span className="text-gray-500">to</span>
                      {tier.maxQty !== null ? (
                        <input
                          type="number"
                          value={tier.maxQty}
                          onChange={(e) => {
                            const newTiers = [...bulkTiers];
                            newTiers[index].maxQty = parseInt(e.target.value) || null;
                            setBulkTiers(newTiers);
                          }}
                          className="w-16 px-2 py-1 border rounded text-center"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">unlimited</span>
                      )}
                      <span className="text-gray-500">units</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-bold" style={{ color: '#0d9488' }}>£</span>
                      <input
                        type="number"
                        step="0.01"
                        value={tier.price}
                        onChange={(e) => {
                          const newTiers = [...bulkTiers];
                          newTiers[index].price = parseFloat(e.target.value) || 0;
                          setBulkTiers(newTiers);
                        }}
                        className="w-24 px-2 py-1 border rounded font-bold"
                        style={{ color: '#0d9488' }}
                      />
                    </div>
                  </div>
                  {index === bulkTiers.length - 1 && bulkTiers.length > 1 && (
                    <button
                      onClick={() => setBulkTiers(bulkTiers.slice(0, -1))}
                      className="p-2 text-red-500 hover:bg-red-100 rounded transition"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}

              {/* Add Tier Button */}
              <button
                onClick={() => {
                  const lastTier = bulkTiers[bulkTiers.length - 1];
                  const newMinQty = (lastTier.maxQty || lastTier.minQty) + 1;
                  // Set previous tier's maxQty if it was unlimited
                  const updatedTiers = bulkTiers.map((t, i) =>
                    i === bulkTiers.length - 1 && t.maxQty === null
                      ? { ...t, maxQty: newMinQty - 1 }
                      : t
                  );
                  setBulkTiers([
                    ...updatedTiers,
                    { minQty: newMinQty, maxQty: null, price: Number((lastTier.price * 0.95).toFixed(2)) }
                  ]);
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-teal-500 hover:text-teal-600 transition"
              >
                + Add Another Tier
              </button>
            </div>

            <div className="flex gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => saveBulkPricing(showBulkPricing)}
                disabled={savingPrice}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50"
              >
                {savingPrice ? 'Saving...' : 'Save Bulk Pricing'}
              </button>
              <button
                onClick={() => setShowBulkPricing(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Product Form Modal */}
      {showNewProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg" style={{ color: '#1e3a5f' }}>
                <Package className="inline-block mr-2 mb-1" size={20} />
                Add New Product
              </h3>
              {scannedBarcode && !isManualAdd && (
                <p className="text-sm text-gray-500 mt-1">
                  Barcode: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{scannedBarcode}</span>
                </p>
              )}
            </div>

            <div className="p-6 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({...newProductForm, name: e.target.value})}
                  placeholder="e.g., Tilda Basmati Rice 5kg"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  autoFocus
                />
              </div>

              {/* Price and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (£) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({...newProductForm, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={newProductForm.unit}
                    onChange={(e) => setNewProductForm({...newProductForm, unit: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="each">Each</option>
                    <option value="kg">Kg</option>
                    <option value="pack">Pack</option>
                    <option value="box">Box</option>
                    <option value="case">Case</option>
                    <option value="bag">Bag</option>
                    <option value="bottle">Bottle</option>
                    <option value="tin">Tin</option>
                  </select>
                </div>
              </div>

              {/* Category and Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({...newProductForm, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Select category</option>
                    {categoriesFromDb.length > 0 ? (
                      categoriesFromDb.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                    ) : (
                      <>
                        <option value="Grains">Grains</option>
                        <option value="Oils">Oils</option>
                        <option value="Produce">Produce</option>
                        <option value="Fish">Fish</option>
                        <option value="Meat">Meat</option>
                        <option value="Spices">Spices</option>
                        <option value="Canned">Canned</option>
                        <option value="Drinks">Drinks</option>
                        <option value="Flour">Flour</option>
                        <option value="General">General</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={newProductForm.stock_quantity}
                    onChange={(e) => setNewProductForm({...newProductForm, stock_quantity: e.target.value})}
                    placeholder="1"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Barcode (for manual add) */}
              {isManualAdd && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Barcode className="inline-block mr-1 mb-0.5" size={14} />
                    Barcode (Optional)
                  </label>
                  <input
                    type="text"
                    value={newProductForm.barcode}
                    onChange={(e) => setNewProductForm({...newProductForm, barcode: e.target.value})}
                    placeholder="e.g., 5012345678901"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              )}

              {/* Expiry Date and Batch */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block mr-1 mb-0.5" size={14} />
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newProductForm.expiry_date}
                    onChange={(e) => setNewProductForm({...newProductForm, expiry_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={newProductForm.batch_number}
                    onChange={(e) => setNewProductForm({...newProductForm, batch_number: e.target.value})}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Product Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Image className="inline-block mr-1 mb-0.5" size={14} />
                  Product Image
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, false)}
                  className="hidden"
                />
                {imagePreview || newProductForm.image_url ? (
                  <div className="relative">
                    <img
                      src={imagePreview || newProductForm.image_url}
                      alt="Product preview"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(false)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    >
                      <X size={16} />
                    </button>
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <Loader2 className="animate-spin text-white" size={32} />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-teal-500 hover:text-teal-600 transition disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <Loader2 className="animate-spin mb-2" size={32} />
                    ) : (
                      <Upload className="mb-2" size={32} />
                    )}
                    <span className="text-sm">{uploadingImage ? 'Uploading...' : 'Click to upload image'}</span>
                    <span className="text-xs text-gray-400 mt-1">Max 5MB, JPG/PNG</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={saveNewProduct}
                disabled={savingProduct}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50"
              >
                {savingProduct ? 'Saving...' : 'Add Product'}
              </button>
              <button
                onClick={() => {
                  setShowNewProductForm(false);
                  setScannedBarcode('');
                  setIsManualAdd(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg" style={{ color: '#1e3a5f' }}>
                <Edit3 className="inline-block mr-2 mb-1" size={20} />
                Edit Product
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Update product details
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="e.g., Tilda Basmati Rice 5kg"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  autoFocus
                />
              </div>

              {/* Price and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (£) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={editForm.unit}
                    onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="each">Each</option>
                    <option value="kg">Kg</option>
                    <option value="pack">Pack</option>
                    <option value="box">Box</option>
                    <option value="case">Case</option>
                    <option value="bag">Bag</option>
                    <option value="bottle">Bottle</option>
                    <option value="tin">Tin</option>
                  </select>
                </div>
              </div>

              {/* Category and Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Select category</option>
                    {categoriesFromDb.length > 0 ? (
                      categoriesFromDb.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                    ) : (
                      <>
                        <option value="Grains">Grains</option>
                        <option value="Oils">Oils</option>
                        <option value="Produce">Produce</option>
                        <option value="Fish">Fish</option>
                        <option value="Meat">Meat</option>
                        <option value="Spices">Spices</option>
                        <option value="Canned">Canned</option>
                        <option value="Drinks">Drinks</option>
                        <option value="Flour">Flour</option>
                        <option value="General">General</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={editForm.stock_quantity}
                    onChange={(e) => setEditForm({...editForm, stock_quantity: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Barcode className="inline-block mr-1 mb-0.5" size={14} />
                  Barcode
                </label>
                <input
                  type="text"
                  value={editForm.barcode}
                  onChange={(e) => setEditForm({...editForm, barcode: e.target.value})}
                  placeholder="e.g., 5012345678901"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Expiry Date and Batch */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline-block mr-1 mb-0.5" size={14} />
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={editForm.expiry_date}
                    onChange={(e) => setEditForm({...editForm, expiry_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={editForm.batch_number}
                    onChange={(e) => setEditForm({...editForm, batch_number: e.target.value})}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Product Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Image className="inline-block mr-1 mb-0.5" size={14} />
                  Product Image
                </label>
                <input
                  type="file"
                  ref={editFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, true)}
                  className="hidden"
                />
                {editImagePreview || editForm.image_url ? (
                  <div className="relative">
                    <img
                      src={editImagePreview || editForm.image_url}
                      alt="Product preview"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(true)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    >
                      <X size={16} />
                    </button>
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <Loader2 className="animate-spin text-white" size={32} />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-teal-500 hover:text-teal-600 transition disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <Loader2 className="animate-spin mb-2" size={32} />
                    ) : (
                      <Upload className="mb-2" size={32} />
                    )}
                    <span className="text-sm">{uploadingImage ? 'Uploading...' : 'Click to upload image'}</span>
                    <span className="text-xs text-gray-400 mt-1">Max 5MB, JPG/PNG</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={saveEditedProduct}
                disabled={savingProduct}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50"
              >
                {savingProduct ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg text-red-600">
                <Trash2 className="inline-block mr-2 mb-1" size={20} />
                Delete Product
              </h3>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete this product?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-semibold text-gray-800">{deletingProduct.name}</p>
                <p className="text-sm text-gray-500">{deletingProduct.category} • £{deletingProduct.price.toFixed(2)}</p>
              </div>
              <p className="text-sm text-gray-500">
                This will hide the product from your storefront. You can restore it later if needed.
              </p>
            </div>

            <div className="flex gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={deleteProduct}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Product'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingProduct(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager */}
      {showCategoryManager && (
        <CategoryManager
          storeId="ishas-treat"
          onClose={handleCategoryManagerClose}
          onCategoriesChange={handleCategoriesChange}
        />
      )}

      {/* Storage Diagnostics Modal */}
      {showDiagnostics && (
        <StorageDiagnosticsPanel onClose={() => setShowDiagnostics(false)} />
      )}
    </div>
  );
}
