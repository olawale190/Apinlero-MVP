import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useBusinessContext } from '../contexts/BusinessContext';
import type { Business } from '../lib/business-resolver';
import { uploadAndTrack, BUCKETS } from '../lib/storage';
import { compressImage } from '../lib/imageCompression';
import {
  Image,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
  ChevronRight,
  ImagePlus
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  is_active: boolean;
}

interface ImageMatch {
  file: File;
  previewUrl: string;
  productId: string | null;
}

interface BulkImageUploadProps {
  products: Product[];
  onComplete: () => void;
  onClose: () => void;
  business?: Business | null;
}

function autoMatchImages(files: File[], productsWithoutImages: Product[]): Map<string, string | null> {
  const matches = new Map<string, string | null>();
  const usedProducts = new Set<string>();

  for (const file of files) {
    const fileName = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]/g, ' ')
      .replace(/\d{10,}/g, '')
      .trim()
      .toLowerCase();

    let bestMatch: Product | null = null;
    let bestScore = 0;

    for (const product of productsWithoutImages) {
      if (usedProducts.has(product.id)) continue;
      const productName = product.name.toLowerCase();

      if (fileName === productName) {
        bestMatch = product;
        break;
      }

      if (fileName.includes(productName) || productName.includes(fileName)) {
        const score = Math.min(fileName.length, productName.length) /
          Math.max(fileName.length, productName.length);
        if (score > bestScore && score > 0.3) {
          bestMatch = product;
          bestScore = score;
        }
      }
    }

    matches.set(file.name, bestMatch?.id || null);
    if (bestMatch) usedProducts.add(bestMatch.id);
  }

  return matches;
}

export default function BulkImageUpload({ products, onComplete, onClose, business: businessProp }: BulkImageUploadProps) {
  const businessContext = useBusinessContext();
  const business = businessProp ?? businessContext?.business ?? null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'select' | 'match' | 'uploading' | 'complete'>('select');
  const [imageMatches, setImageMatches] = useState<ImageMatch[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadName, setCurrentUploadName] = useState('');
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0, failed: 0, errors: []
  });

  const productsWithoutImages = products.filter(p => !p.image_url && p.is_active);
  const matchedCount = imageMatches.filter(m => m.productId).length;

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      imageMatches.forEach(m => URL.revokeObjectURL(m.previewUrl));
    };
  }, []);

  const handleFilesSelected = (files: FileList | File[]) => {
    const imageFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
        imageFiles.push(file);
      }
    }

    if (imageFiles.length === 0) {
      alert('No valid images selected. Please select image files under 5MB.');
      return;
    }

    const autoMatches = autoMatchImages(imageFiles, productsWithoutImages);

    const matches: ImageMatch[] = imageFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      productId: autoMatches.get(file.name) || null
    }));

    // Clean up old previews
    imageMatches.forEach(m => URL.revokeObjectURL(m.previewUrl));

    setImageMatches(matches);
    setStep('match');
  };

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
    if (e.dataTransfer.files?.length) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const updateMatch = (index: number, productId: string | null) => {
    setImageMatches(prev => prev.map((m, i) =>
      i === index ? { ...m, productId } : m
    ));
  };

  const removeImage = (index: number) => {
    setImageMatches(prev => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const getAvailableProducts = (currentIndex: number): Product[] => {
    const usedIds = new Set(
      imageMatches
        .filter((m, i) => i !== currentIndex && m.productId)
        .map(m => m.productId!)
    );
    return productsWithoutImages.filter(p => !usedIds.has(p.id));
  };

  const handleUpload = async () => {
    const matched = imageMatches.filter(m => m.productId);
    if (matched.length === 0) return;

    setStep('uploading');
    setUploadProgress(0);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < matched.length; i++) {
      const { file, productId } = matched[i];
      const product = products.find(p => p.id === productId);
      if (!product) continue;

      setCurrentUploadName(product.name);
      setUploadProgress(Math.round(((i) / matched.length) * 100));

      try {
        const compression = await compressImage(file, {
          maxWidth: 1200, maxHeight: 1200, quality: 0.8, maxSizeKB: 500
        });

        const uploadResult = await uploadAndTrack(BUCKETS.PRODUCTS, compression.file, {
          folder: 'catalog',
          source: 'web',
          productId: product.id,
          metadata: {
            uploadedFrom: 'bulk-image-upload',
            originalSize: compression.originalSize,
            compressedSize: compression.compressedSize,
            wasCompressed: compression.wasCompressed
          }
        });

        if (!uploadResult.success || !uploadResult.url) {
          results.failed++;
          results.errors.push(`${product.name}: ${uploadResult.error || 'Upload failed'}`);
          continue;
        }

        let query = supabase.from('products').update({ image_url: uploadResult.url }).eq('id', product.id);
        if (business?.id) query = query.eq('business_id', business.id);
        let { error } = await query;
        if (error && error.message?.includes('business_id')) {
          ({ error } = await supabase.from('products').update({ image_url: uploadResult.url }).eq('id', product.id));
        }

        if (error) {
          results.failed++;
          results.errors.push(`${product.name}: DB update failed`);
        } else {
          results.success++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`${product.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    setUploadProgress(100);
    setUploadResults(results);
    setStep('complete');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ImagePlus size={24} />
              <div>
                <h2 className="text-xl font-bold">Bulk Add Product Images</h2>
                <p className="text-indigo-100 text-sm">Upload images for multiple products at once</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Step 1: Select Images */}
          {step === 'select' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Image className="text-indigo-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-indigo-900 mb-1">
                      {productsWithoutImages.length} of {products.filter(p => p.is_active).length} products need images
                    </h3>
                    <p className="text-sm text-indigo-700">
                      Select multiple photos from your device. Tip: name your files like your products (e.g. "palm-oil.jpg") for automatic matching.
                    </p>
                  </div>
                </div>
              </div>

              {productsWithoutImages.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">All products have images!</h3>
                  <p className="text-gray-500">No uploads needed.</p>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files?.length && handleFilesSelected(e.target.files)}
                    className="hidden"
                  />

                  <Upload size={48} className={`mx-auto mb-4 ${dragActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {dragActive ? 'Drop your images here' : 'Drag and drop your product images'}
                  </h3>
                  <p className="text-gray-500 mb-4">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Browse Photos
                  </button>
                  <p className="text-sm text-gray-400 mt-4">JPEG, PNG, WebP - up to 5MB each</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Match Images to Products */}
          {step === 'match' && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex items-center justify-between bg-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-gray-800">{imageMatches.length} images selected</span>
                  <span className="text-green-600 font-medium">{matchedCount} matched</span>
                  <span className="text-gray-400">{imageMatches.length - matchedCount} unmatched</span>
                </div>
                <button
                  onClick={() => {
                    setStep('select');
                    imageMatches.forEach(m => URL.revokeObjectURL(m.previewUrl));
                    setImageMatches([]);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Change Images
                </button>
              </div>

              {/* Image grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {imageMatches.map((match, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg overflow-hidden ${
                      match.productId ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="relative h-32 bg-gray-100">
                      <img
                        src={match.previewUrl}
                        alt={match.file.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                      {match.productId && (
                        <div className="absolute top-2 left-2">
                          <CheckCircle2 size={20} className="text-green-500 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-400 truncate mb-2">{match.file.name}</p>
                      <select
                        value={match.productId || ''}
                        onChange={(e) => updateMatch(index, e.target.value || null)}
                        className={`w-full text-sm border rounded-lg px-2 py-1.5 ${
                          match.productId
                            ? 'border-green-300 bg-green-50 text-green-800'
                            : 'border-gray-300 text-gray-600'
                        }`}
                      >
                        <option value="">-- Select product --</option>
                        {getAvailableProducts(index).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                        {/* Keep the currently selected product in the list even if "used" */}
                        {match.productId && !getAvailableProducts(index).find(p => p.id === match.productId) && (
                          <option value={match.productId}>
                            {products.find(p => p.id === match.productId)?.name}
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {imageMatches.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  No images remaining. Go back to select more.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Uploading */}
          {step === 'uploading' && (
            <div className="py-12 text-center">
              <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Uploading Images...</h3>
              <p className="text-gray-500 mb-2">Please wait while we add images to your products</p>
              <p className="text-sm text-indigo-600 font-medium mb-6">{currentUploadName}</p>

              <div className="max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">{uploadProgress}% complete</p>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="py-8 text-center">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                uploadResults.failed === 0 ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                {uploadResults.failed === 0 ? (
                  <CheckCircle2 size={32} className="text-green-600" />
                ) : (
                  <AlertTriangle size={32} className="text-amber-600" />
                )}
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {uploadResults.failed === 0 ? 'All Images Uploaded!' : 'Upload Completed with Issues'}
              </h3>

              <div className="flex justify-center gap-6 my-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{uploadResults.success}</p>
                  <p className="text-sm text-gray-500">Images Added</p>
                </div>
                {uploadResults.failed > 0 && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{uploadResults.failed}</p>
                    <p className="text-sm text-gray-500">Failed</p>
                  </div>
                )}
              </div>

              {uploadResults.errors.length > 0 && (
                <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <p className="font-medium text-red-800 mb-2">Errors:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {uploadResults.errors.map((error, i) => (
                      <li key={i}>&bull; {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={onComplete}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Done - View Inventory
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'match' && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => {
                setStep('select');
                imageMatches.forEach(m => URL.revokeObjectURL(m.previewUrl));
                setImageMatches([]);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Back
            </button>
            <button
              onClick={handleUpload}
              disabled={matchedCount === 0}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={18} />
              Upload {matchedCount} Image{matchedCount !== 1 ? 's' : ''}
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
