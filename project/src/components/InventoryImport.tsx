import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useBusinessContext } from '../contexts/BusinessContext';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
  FileText,
  Table,
  HelpCircle
} from 'lucide-react';

interface ImportedProduct {
  name: string;
  price: number;
  category: string;
  unit: string;
  stock_quantity: number;
  barcode?: string;
  expiry_date?: string;
  batch_number?: string;
  description?: string;
  isValid: boolean;
  errors: string[];
}

interface InventoryImportProps {
  onImportComplete: () => void;
  onClose: () => void;
}

// Valid categories for validation
const VALID_CATEGORIES = [
  'Grains', 'Oils', 'Produce', 'Fish', 'Meat', 'Spices', 'Canned',
  'Drinks', 'Flour', 'Seeds', 'Seafood', 'Seasonings', 'Snacks',
  'Dairy', 'Frozen', 'General'
];

// Valid units
const VALID_UNITS = ['each', 'kg', 'pack', 'box', 'case', 'bag', 'bottle', 'tin', 'litre', 'gram'];

export default function InventoryImport({ onImportComplete, onClose }: InventoryImportProps) {
  const { business } = useBusinessContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [parsedProducts, setParsedProducts] = useState<ImportedProduct[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: []
  });
  const [dragActive, setDragActive] = useState(false);

  // Parse CSV content
  const parseCSV = (content: string): ImportedProduct[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Get headers from first line
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Map header names to expected fields
    const headerMap: Record<string, string> = {
      'product name': 'name',
      'name': 'name',
      'price (gbp)': 'price',
      'price': 'price',
      'category': 'category',
      'unit': 'unit',
      'stock quantity': 'stock_quantity',
      'stock': 'stock_quantity',
      'quantity': 'stock_quantity',
      'barcode': 'barcode',
      'expiry date': 'expiry_date',
      'expiry': 'expiry_date',
      'batch number': 'batch_number',
      'batch': 'batch_number',
      'description': 'description'
    };

    const products: ImportedProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v.trim())) continue;

      const product: ImportedProduct = {
        name: '',
        price: 0,
        category: 'General',
        unit: 'each',
        stock_quantity: 0,
        isValid: true,
        errors: []
      };

      headers.forEach((header, index) => {
        const field = headerMap[header];
        const value = values[index]?.trim() || '';

        switch (field) {
          case 'name':
            product.name = value;
            break;
          case 'price':
            const price = parseFloat(value.replace(/[£$,]/g, ''));
            product.price = isNaN(price) ? 0 : price;
            break;
          case 'category':
            product.category = value || 'General';
            break;
          case 'unit':
            product.unit = value.toLowerCase() || 'each';
            break;
          case 'stock_quantity':
            const qty = parseInt(value);
            product.stock_quantity = isNaN(qty) ? 0 : qty;
            break;
          case 'barcode':
            product.barcode = value || undefined;
            break;
          case 'expiry_date':
            product.expiry_date = parseDate(value) || undefined;
            break;
          case 'batch_number':
            product.batch_number = value || undefined;
            break;
          case 'description':
            product.description = value || undefined;
            break;
        }
      });

      // Validate product
      validateProduct(product);
      products.push(product);
    }

    return products;
  };

  // Parse a single CSV line (handles quoted values with commas)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  };

  // Parse date from various formats
  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;

    // Try ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Try DD/MM/YYYY format
    const dmyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try MM/DD/YYYY format
    const mdyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdyMatch) {
      const [, month, day, year] = mdyMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try to parse with Date object
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return null;
  };

  // Validate a product
  const validateProduct = (product: ImportedProduct) => {
    product.errors = [];

    if (!product.name || product.name.length < 2) {
      product.errors.push('Product name is required (min 2 characters)');
    }

    if (product.price <= 0) {
      product.errors.push('Price must be greater than 0');
    }

    if (product.stock_quantity < 0) {
      product.errors.push('Stock quantity cannot be negative');
    }

    // Normalize category
    const normalizedCategory = VALID_CATEGORIES.find(
      c => c.toLowerCase() === product.category.toLowerCase()
    );
    if (normalizedCategory) {
      product.category = normalizedCategory;
    } else {
      product.category = 'General';
    }

    // Normalize unit
    const normalizedUnit = VALID_UNITS.find(
      u => u.toLowerCase() === product.unit.toLowerCase()
    );
    if (normalizedUnit) {
      product.unit = normalizedUnit;
    } else {
      product.unit = 'each';
    }

    product.isValid = product.errors.length === 0;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file) return;

    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/csv'];
    const isCSV = validTypes.includes(file.type) || file.name.endsWith('.csv');

    if (!isCSV) {
      alert('Please upload a CSV file');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const products = parseCSV(content);
      setParsedProducts(products);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Import products to database
  const handleImport = async () => {
    if (!business?.id) {
      alert('Error: No business context available');
      return;
    }

    const validProducts = parsedProducts.filter(p => p.isValid);
    if (validProducts.length === 0) {
      alert('No valid products to import');
      return;
    }

    setStep('importing');
    setImportProgress(0);

    const results = { success: 0, failed: 0, errors: [] as string[] };
    const batchSize = 10;

    for (let i = 0; i < validProducts.length; i += batchSize) {
      const batch = validProducts.slice(i, i + batchSize);

      const productsToInsert = batch.map(p => ({
        business_id: business.id,
        name: p.name,
        price: Math.round(p.price * 100), // Convert to pence
        category: p.category,
        unit: p.unit,
        stock_quantity: p.stock_quantity,
        barcode: p.barcode || null,
        expiry_date: p.expiry_date || null,
        batch_number: p.batch_number || null,
        is_active: true
      }));

      const { data, error } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select();

      if (error) {
        results.failed += batch.length;
        results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        results.success += data?.length || 0;
      }

      setImportProgress(Math.round(((i + batch.length) / validProducts.length) * 100));
    }

    setImportResults(results);
    setStep('complete');
  };

  // Download template
  const handleDownloadTemplate = () => {
    window.open('/templates/inventory_template.csv', '_blank');
  };

  // Count valid/invalid products
  const validCount = parsedProducts.filter(p => p.isValid).length;
  const invalidCount = parsedProducts.filter(p => !p.isValid).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-teal-600 to-teal-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={24} />
              <div>
                <h2 className="text-xl font-bold">Bulk Import Inventory</h2>
                <p className="text-teal-100 text-sm">Upload a CSV file to add multiple products at once</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">Need a template?</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Download our CSV template with example products. Fill it with your inventory data and upload it here.
                    </p>
                    <button
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                    >
                      <Download size={16} />
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                  dragActive
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                <Upload size={48} className={`mx-auto mb-4 ${dragActive ? 'text-teal-600' : 'text-gray-400'}`} />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {dragActive ? 'Drop your file here' : 'Drag and drop your CSV file'}
                </h3>
                <p className="text-gray-500 mb-4">or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
                >
                  Browse Files
                </button>
                <p className="text-sm text-gray-400 mt-4">Supports CSV files up to 10MB</p>
              </div>

              {/* Format Guide */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Table size={18} />
                  Required CSV Format
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Column</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Required</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Example</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      <tr className="border-b"><td className="py-2 px-2">Product Name</td><td className="py-2 px-2 text-green-600">Yes</td><td className="py-2 px-2 font-mono text-xs">Tilda Basmati Rice 5kg</td></tr>
                      <tr className="border-b"><td className="py-2 px-2">Price (GBP)</td><td className="py-2 px-2 text-green-600">Yes</td><td className="py-2 px-2 font-mono text-xs">12.99</td></tr>
                      <tr className="border-b"><td className="py-2 px-2">Category</td><td className="py-2 px-2 text-gray-400">No</td><td className="py-2 px-2 font-mono text-xs">Grains</td></tr>
                      <tr className="border-b"><td className="py-2 px-2">Unit</td><td className="py-2 px-2 text-gray-400">No</td><td className="py-2 px-2 font-mono text-xs">bag, each, kg, pack</td></tr>
                      <tr className="border-b"><td className="py-2 px-2">Stock Quantity</td><td className="py-2 px-2 text-gray-400">No</td><td className="py-2 px-2 font-mono text-xs">50</td></tr>
                      <tr className="border-b"><td className="py-2 px-2">Barcode</td><td className="py-2 px-2 text-gray-400">No</td><td className="py-2 px-2 font-mono text-xs">5011157100012</td></tr>
                      <tr className="border-b"><td className="py-2 px-2">Expiry Date</td><td className="py-2 px-2 text-gray-400">No</td><td className="py-2 px-2 font-mono text-xs">2026-12-31</td></tr>
                      <tr><td className="py-2 px-2">Batch Number</td><td className="py-2 px-2 text-gray-400">No</td><td className="py-2 px-2 font-mono text-xs">BATCH001</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between bg-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FileText className="text-teal-600" size={24} />
                  <div>
                    <p className="font-medium text-gray-800">{fileName}</p>
                    <p className="text-sm text-gray-500">{parsedProducts.length} products found</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setStep('upload');
                    setParsedProducts([]);
                    setFileName('');
                  }}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Change File
                </button>
              </div>

              {/* Validation Summary */}
              <div className="flex gap-4">
                <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 size={20} />
                    <span className="font-semibold">{validCount} Valid</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">Ready to import</p>
                </div>
                {invalidCount > 0 && (
                  <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle size={20} />
                      <span className="font-semibold">{invalidCount} Invalid</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">Will be skipped</p>
                  </div>
                )}
              </div>

              {/* Products Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Product Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Stock</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedProducts.map((product, index) => (
                        <tr
                          key={index}
                          className={`border-t ${product.isValid ? 'bg-white' : 'bg-red-50'}`}
                        >
                          <td className="py-3 px-4">
                            {product.isValid ? (
                              <CheckCircle2 size={18} className="text-green-500" />
                            ) : (
                              <div className="group relative">
                                <XCircle size={18} className="text-red-500" />
                                <div className="absolute left-0 top-6 bg-red-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap z-10">
                                  {product.errors.join(', ')}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-800">{product.name || '-'}</td>
                          <td className="py-3 px-4 text-gray-600">£{product.price.toFixed(2)}</td>
                          <td className="py-3 px-4 text-gray-600">{product.category}</td>
                          <td className="py-3 px-4 text-gray-600">{product.stock_quantity}</td>
                          <td className="py-3 px-4 text-gray-600">{product.expiry_date || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-medium text-amber-800">Some products have errors</p>
                      <p className="text-sm text-amber-700">
                        {invalidCount} product(s) will be skipped during import. Hover over the red X to see errors.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="py-12 text-center">
              <Loader2 size={48} className="animate-spin text-teal-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Importing Products...</h3>
              <p className="text-gray-500 mb-6">Please wait while we add your products to the inventory</p>

              <div className="max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-teal-600 h-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">{importProgress}% complete</p>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="py-8 text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                importResults.failed === 0 ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                {importResults.failed === 0 ? (
                  <CheckCircle2 size={32} className="text-green-600" />
                ) : (
                  <AlertTriangle size={32} className="text-amber-600" />
                )}
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {importResults.failed === 0 ? 'Import Complete!' : 'Import Completed with Issues'}
              </h3>

              <div className="flex justify-center gap-6 my-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{importResults.success}</p>
                  <p className="text-sm text-gray-500">Products Added</p>
                </div>
                {importResults.failed > 0 && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{importResults.failed}</p>
                    <p className="text-sm text-gray-500">Failed</p>
                  </div>
                )}
              </div>

              {importResults.errors.length > 0 && (
                <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <p className="font-medium text-red-800 mb-2">Errors:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {importResults.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => {
                  onImportComplete();
                  onClose();
                }}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
              >
                Done - View Inventory
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'preview') && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => {
                setStep('upload');
                setParsedProducts([]);
                setFileName('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={validCount === 0}
              className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={18} />
              Import {validCount} Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
