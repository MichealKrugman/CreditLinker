'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UploadStats {
  totalRows: number;
  validTransactions: number;
  duplicates: number;
  errors: number;
  categorized: number;
}

export function FileUpload() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<UploadStats | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }, []);

  const validateAndSetFile = (file: File) => {
    // Reset state
    setError('');
    setStats(null);

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a CSV or Excel file.');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      setProgress('Uploading file...');

      // Upload file
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      setUploading(false);
      setProcessing(true);
      setProgress('Processing transactions...');

      // Process the file
      const processRes = await fetch(`/api/process/${uploadData.data.importId}`, {
        method: 'POST',
      });

      const processData = await processRes.json();

      if (!processData.success) {
        throw new Error(processData.error || 'Processing failed');
      }

      setProcessing(false);
      setProgress('');
      setStats(processData.data.stats);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUploading(false);
      setProcessing(false);
      setProgress('');
    }
  };

  const reset = () => {
    setFile(null);
    setError('');
    setStats(null);
    setProgress('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!stats ? (
        <>
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center
              transition-all duration-200 cursor-pointer
              ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-105'
                  : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
              }
              ${uploading || processing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileSelect}
              disabled={uploading || processing}
            />

            <label
              htmlFor="file-upload"
              className="cursor-pointer"
            >
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="text-sm text-gray-600">
                {file ? (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-primary">
                      Click to upload
                    </span>{' '}
                    or drag and drop
                    <p className="mt-1 text-xs text-gray-500">
                      CSV or Excel files (max 10MB)
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Progress indicator */}
          {progress && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                <p className="text-sm text-blue-800">{progress}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {file && !uploading && !processing && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleUpload}
                className="flex-1 btn btn-primary"
              >
                Process File
              </button>
              <button
                onClick={reset}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      ) : (
        /* Success stats */
        <div className="space-y-4">
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="h-6 w-6 text-green-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-green-900">
                  File processed successfully!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Total Rows</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {stats.totalRows}
              </p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Valid Transactions</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {stats.validTransactions}
              </p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Duplicates Skipped</p>
              <p className="mt-1 text-2xl font-bold text-orange-600">
                {stats.duplicates}
              </p>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Errors</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {stats.errors}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
