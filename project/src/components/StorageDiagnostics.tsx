import { useState } from 'react';
import { runStorageDiagnostics, StorageDiagnosticsResult } from '../lib/storage';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Database, RefreshCw } from 'lucide-react';

interface StorageDiagnosticsProps {
  onClose: () => void;
}

export default function StorageDiagnosticsPanel({ onClose }: StorageDiagnosticsProps) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<StorageDiagnosticsResult | null>(null);

  const runDiagnostics = async () => {
    setRunning(true);
    const diagnostics = await runStorageDiagnostics();
    setResults(diagnostics);
    setRunning(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b">
          <h3 className="font-bold text-lg" style={{ color: '#1e3a5f' }}>
            <Database className="inline-block mr-2 mb-1" size={20} />
            Storage Diagnostics
          </h3>
        </div>

        <div className="p-6">
          {!results && !running && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Run diagnostics to check if storage is properly configured for image uploads.
              </p>
              <button
                onClick={runDiagnostics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Run Diagnostics
              </button>
            </div>
          )}

          {running && (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
              <p className="text-gray-600">Checking storage configuration...</p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className={`p-4 rounded-lg ${results.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  {results.success ? (
                    <CheckCircle className="text-green-600" size={24} />
                  ) : (
                    <XCircle className="text-red-600" size={24} />
                  )}
                  <span className={`font-semibold ${results.success ? 'text-green-800' : 'text-red-800'}`}>
                    {results.success ? 'Storage is working!' : 'Storage issues detected'}
                  </span>
                </div>
              </div>

              {/* Error message if any */}
              {results.error && (
                <div className="p-3 bg-red-100 rounded-lg text-red-700 text-sm">
                  {results.error}
                </div>
              )}

              {/* Bucket Status */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Bucket Status:</h4>
                {Object.entries(results.bucketsExist).map(([bucket, exists]) => (
                  <div key={bucket} className="flex items-center gap-2 text-sm">
                    {exists ? (
                      <CheckCircle className="text-green-500" size={16} />
                    ) : (
                      <XCircle className="text-red-500" size={16} />
                    )}
                    <span className="font-mono">{bucket}</span>
                    {exists && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        results.bucketsPublic[bucket] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {results.bucketsPublic[bucket] ? 'public' : 'private'}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Upload Test */}
              <div className="flex items-center gap-2 text-sm">
                {results.uploadTestPassed ? (
                  <CheckCircle className="text-green-500" size={16} />
                ) : (
                  <XCircle className="text-red-500" size={16} />
                )}
                <span>Upload permission test</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  results.uploadTestPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {results.uploadTestPassed ? 'passed' : 'failed'}
                </span>
              </div>

              {/* Recommendations */}
              {results.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">
                    {results.success ? 'Status:' : 'To Fix:'}
                  </h4>
                  {results.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className={`mt-0.5 flex-shrink-0 ${
                        results.success ? 'text-green-500' : 'text-amber-500'
                      }`} size={16} />
                      <span className="text-gray-600">{rec}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* SQL Help for fixing */}
              {!results.success && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Need to run SQL?</h4>
                  <p className="text-sm text-blue-700">
                    Go to Supabase Dashboard → SQL Editor and run the storage policies SQL.
                    Check CLAUDE.md for the full script.
                  </p>
                </div>
              )}

              {/* Re-run button */}
              <button
                onClick={runDiagnostics}
                disabled={running}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <RefreshCw size={16} />
                Re-run Diagnostics
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
