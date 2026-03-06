import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useBusinessContext } from '../contexts/BusinessContext';
import { uploadApi } from '../lib/api';
import { compressImage } from '../lib/imageCompression';
import { Upload, X, Check, AlertTriangle, Search, ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductStub {
  id: string;
  name: string;
  image_url: string | null;
}

type MatchConfidence = 'exact' | 'high' | 'medium' | 'low';

interface UploadedImage {
  originalFilename: string;
  cloudinaryUrl: string;
  publicId: string;
  tags: string[];
}

interface ImageMatch {
  image: UploadedImage;
  product: ProductStub | null;
  confidence: MatchConfidence | null;
  score: number;
}

interface MatchResult {
  matched: ImageMatch[];
  unmatched: ImageMatch[];
}

type Step = 'idle' | 'uploading' | 'reviewing' | 'saving' | 'done';

interface BulkImageUploadProps {
  onComplete: () => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const confidenceColors: Record<MatchConfidence, string> = {
  exact: 'bg-green-100 text-green-800',
  high: 'bg-green-50 text-green-700',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-orange-100 text-orange-800',
};

const confidenceLabels: Record<MatchConfidence, string> = {
  exact: 'Exact',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BulkImageUpload({ onComplete, onClose }: BulkImageUploadProps) {
  const businessContext = useBusinessContext();
  const [step, setStep] = useState<Step>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [allMatches, setAllMatches] = useState<ImageMatch[]>([]);
  const [assignments, setAssignments] = useState<Map<number, string | null>>(new Map());
  const [allProducts, setAllProducts] = useState<ProductStub[]>([]);
  const [saveResult, setSaveResult] = useState<{ updated: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [productSearch, setProductSearch] = useState<Record<number, string>>({});
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Load products on mount
  useEffect(() => {
    (async () => {
      let query = supabase
        .from('products')
        .select('id, name, image_url')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (businessContext?.business?.id) {
        query = query.eq('business_id', businessContext.business.id);
      }

      const { data } = await query;
      if (data) setAllProducts(data);
    })();
  }, [businessContext?.business?.id]);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const getToken = async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');
    return session.access_token;
  };

  // ── File handling ──────────────────────────────────────────────────────

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const accepted = Array.from(newFiles).filter(
      (f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 5 * 1024 * 1024,
    );
    if (accepted.length === 0) return;

    const newUrls = accepted.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newUrls]);
    setFiles((prev) => [...prev, ...accepted]);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Upload & match ─────────────────────────────────────────────────────

  const startUpload = async () => {
    if (files.length === 0) return;
    setStep('uploading');
    setError(null);

    try {
      const token = await getToken();

      // Compress images before sending to backend
      const compressedFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const result = await compressImage(files[i], {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8,
            maxSizeKB: 500,
          });
          compressedFiles.push(result.file);
        } catch {
          compressedFiles.push(files[i]); // fallback to original
        }
        setUploadProgress(Math.round(((i + 1) / files.length) * 30)); // 0-30% for compression
      }

      // Upload in batches of 20
      const batchSize = 20;
      const allResults: ImageMatch[] = [];

      for (let i = 0; i < compressedFiles.length; i += batchSize) {
        const batch = compressedFiles.slice(i, i + batchSize);
        const response = await uploadApi.bulk(batch, token);
        const result: MatchResult = response.data;
        allResults.push(...result.matched, ...result.unmatched);
        setUploadProgress(30 + Math.round(((i + batch.length) / compressedFiles.length) * 70)); // 30-100%
      }

      // Pre-populate assignments from auto-matches
      const initialAssignments = new Map<number, string | null>();
      allResults.forEach((match, idx) => {
        if (match.product && match.confidence) {
          initialAssignments.set(idx, match.product.id);
        }
      });

      setAllMatches(allResults);
      setAssignments(initialAssignments);
      setStep('reviewing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStep('idle');
    }
  };

  // ── Assignment management ──────────────────────────────────────────────

  const assignProduct = (matchIndex: number, productId: string | null) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      if (productId === null) {
        next.delete(matchIndex);
      } else {
        next.set(matchIndex, productId);
      }
      return next;
    });
    setOpenDropdown(null);
  };

  const selectAllMatched = () => {
    const next = new Map(assignments);
    allMatches.forEach((match, idx) => {
      if (match.product && match.confidence) {
        next.set(idx, match.product.id);
      }
    });
    setAssignments(next);
  };

  const clearAll = () => {
    setAssignments(new Map());
  };

  // ── Save assignments ──────────────────────────────────────────────────

  const saveAssignments = async () => {
    if (assignments.size === 0) return;
    setStep('saving');
    setError(null);

    try {
      const token = await getToken();
      const assignmentList = Array.from(assignments.entries())
        .filter(([, productId]) => productId !== null)
        .map(([matchIndex, productId]) => ({
          productId: productId!,
          imageUrl: allMatches[matchIndex].image.cloudinaryUrl,
        }));

      const response = await uploadApi.bulkAssign(assignmentList, token);
      setSaveResult({
        updated: response.data.updated,
        failed: response.data.failed?.length || 0,
      });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setStep('reviewing');
    }
  };

  // ── Filter products for dropdown ──────────────────────────────────────

  const getFilteredProducts = (matchIndex: number) => {
    const search = (productSearch[matchIndex] || '').toLowerCase();
    if (!search) return allProducts.slice(0, 20);
    return allProducts.filter((p) => p.name.toLowerCase().includes(search));
  };

  // ── Summary stats ─────────────────────────────────────────────────────

  const matchedCount = allMatches.filter((m) => m.confidence !== null).length;
  const assignedCount = assignments.size;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Bulk Image Upload</h2>
            <p className="text-xs text-gray-500">
              AI auto-tagging identifies products in your images automatically
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Error banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertTriangle size={16} />
              <span className="text-sm">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Step: IDLE — Drop zone ─────────────────────────────────── */}
          {step === 'idle' && (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  dragOver
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                }`}
              >
                <Upload size={40} className="mx-auto text-gray-400 mb-3" />
                <p className="text-lg font-medium text-gray-700">
                  Drag & drop product images here
                </p>
                <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                <p className="text-xs text-gray-400 mt-3">
                  JPEG, PNG, or WebP — up to 5 MB each
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  AI will scan each image and match it to your products
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  You can also name files like the product (e.g. &quot;jollof-rice-mix.jpg&quot;) for better matching
                </p>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      {files.length} file{files.length !== 1 ? 's' : ''} selected ({formatFileSize(totalSize)})
                    </p>
                    <button
                      onClick={() => {
                        previewUrls.forEach((url) => URL.revokeObjectURL(url));
                        setPreviewUrls([]);
                        setFiles([]);
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {files.map((file, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={previewUrls[i]}
                          alt={file.name}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <p className="text-xs text-gray-500 truncate mt-1">{file.name}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(i);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Step: UPLOADING ────────────────────────────────────────── */}
          {step === 'uploading' && (
            <div className="py-12 text-center">
              <Upload size={40} className="mx-auto text-teal-500 mb-4 animate-bounce" />
              <p className="text-lg font-medium text-gray-700">
                {uploadProgress <= 30
                  ? 'Compressing images...'
                  : 'Uploading & scanning images with AI...'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {uploadProgress}% complete
              </p>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-4 max-w-md mx-auto">
                <div
                  className="bg-teal-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-3">
                AI is identifying products in each image — this may take a moment
              </p>
            </div>
          )}

          {/* ── Step: REVIEWING ────────────────────────────────────────── */}
          {step === 'reviewing' && (
            <>
              {/* Summary bar */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                    {matchedCount} AI-matched
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                    {allMatches.length - matchedCount} unmatched
                  </span>
                  <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded font-medium">
                    {assignedCount} to save
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllMatched}
                    className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Select all matched
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {/* Match review list */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {allMatches.map((match, idx) => {
                  const isAssigned = assignments.has(idx);
                  const assignedProductId = assignments.get(idx);
                  const assignedProduct = assignedProductId
                    ? allProducts.find((p) => p.id === assignedProductId)
                    : null;

                  return (
                    <div
                      key={idx}
                      className={`border rounded-lg p-3 flex items-start gap-3 ${
                        isAssigned ? 'border-green-300 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      {/* Thumbnail */}
                      <img
                        src={match.image.cloudinaryUrl}
                        alt={match.image.originalFilename}
                        className="w-16 h-16 object-cover rounded flex-shrink-0"
                      />

                      {/* Info column */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {match.image.originalFilename}
                        </p>

                        {/* AI detected tags */}
                        {match.image.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {match.image.tags.slice(0, 5).map((tag, ti) => (
                              <span
                                key={ti}
                                className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {match.image.tags.length > 5 && (
                              <span className="text-xs text-gray-400">
                                +{match.image.tags.length - 5} more
                              </span>
                            )}
                          </div>
                        )}

                        {match.confidence && (
                          <span
                            className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${confidenceColors[match.confidence]}`}
                          >
                            {confidenceLabels[match.confidence]} match
                          </span>
                        )}
                      </div>

                      {/* Assignment / Product selector */}
                      <div className="flex items-center gap-2 flex-shrink-0 relative">
                        {isAssigned && assignedProduct ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-700 font-medium max-w-[160px] truncate">
                              {assignedProduct.name}
                            </span>
                            <button
                              onClick={() => assignProduct(idx, null)}
                              className="text-red-500 hover:text-red-700"
                              title="Remove assignment"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenDropdown(openDropdown === idx ? null : idx)
                              }
                              className="flex items-center gap-1 text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                            >
                              {match.product ? (
                                <span className="text-gray-700 max-w-[120px] truncate">
                                  {match.product.name}
                                </span>
                              ) : (
                                <span className="text-gray-400">Assign product</span>
                              )}
                              <ChevronDown size={14} />
                            </button>

                            {openDropdown === idx && (
                              <div className="absolute right-0 top-full mt-1 w-64 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                <div className="p-2 border-b sticky top-0 bg-white">
                                  <div className="relative">
                                    <Search
                                      size={14}
                                      className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Search products..."
                                      value={productSearch[idx] || ''}
                                      onChange={(e) =>
                                        setProductSearch((prev) => ({
                                          ...prev,
                                          [idx]: e.target.value,
                                        }))
                                      }
                                      className="w-full pl-7 pr-2 py-1 text-sm border rounded focus:ring-1 focus:ring-teal-500"
                                      autoFocus
                                    />
                                  </div>
                                </div>
                                {getFilteredProducts(idx).map((product) => (
                                  <button
                                    key={product.id}
                                    onClick={() => assignProduct(idx, product.id)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 flex items-center gap-2"
                                  >
                                    <span className="truncate">{product.name}</span>
                                  </button>
                                ))}
                                {getFilteredProducts(idx).length === 0 && (
                                  <p className="text-xs text-gray-400 p-3">No products found</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quick assign from auto-match */}
                        {!isAssigned && match.product && match.confidence && (
                          <button
                            onClick={() => assignProduct(idx, match.product!.id)}
                            className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            title={`Assign to ${match.product.name}`}
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Step: SAVING ───────────────────────────────────────────── */}
          {step === 'saving' && (
            <div className="py-12 text-center">
              <Check size={40} className="mx-auto text-teal-500 mb-4 animate-pulse" />
              <p className="text-lg font-medium text-gray-700">Saving image assignments...</p>
              <p className="text-sm text-gray-500 mt-1">
                Updating {assignments.size} product{assignments.size !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* ── Step: DONE ─────────────────────────────────────────────── */}
          {step === 'done' && saveResult && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <p className="text-xl font-semibold text-gray-800">Images Updated!</p>
              <p className="text-gray-600 mt-2">
                Successfully updated images for{' '}
                <span className="font-bold text-green-700">{saveResult.updated}</span>{' '}
                product{saveResult.updated !== 1 ? 's' : ''}
              </p>
              {saveResult.failed > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  {saveResult.failed} product{saveResult.failed !== 1 ? 's' : ''} failed to update
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t p-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            {step === 'done' ? 'Close' : 'Cancel'}
          </button>

          {step === 'idle' && files.length > 0 && (
            <button
              onClick={startUpload}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex items-center gap-2"
            >
              <Upload size={16} />
              Upload & Match ({files.length} file{files.length !== 1 ? 's' : ''})
            </button>
          )}

          {step === 'reviewing' && (
            <button
              onClick={saveAssignments}
              disabled={assignments.size === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check size={16} />
              Save {assignments.size} Assignment{assignments.size !== 1 ? 's' : ''}
            </button>
          )}

          {step === 'done' && (
            <button
              onClick={() => {
                onComplete();
                onClose();
              }}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
