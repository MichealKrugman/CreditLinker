import { FileUpload } from '@/components/FileUpload';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Upload Transaction Data
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your bank statements (CSV or Excel) to analyze your financial
            health and generate your Financial Identity Score.
          </p>
        </div>

        {/* Upload component */}
        <FileUpload />

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            How to prepare your file
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                1
              </span>
              <p>
                <strong className="text-gray-900">Download from your bank:</strong>{' '}
                Log into your online banking and download your transaction history
                as CSV or Excel format.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                2
              </span>
              <p>
                <strong className="text-gray-900">Required columns:</strong> Your
                file should include Date, Description, and Amount (or separate
                Debit/Credit columns).
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                3
              </span>
              <p>
                <strong className="text-gray-900">Time period:</strong> Upload at
                least 3-6 months of transactions for accurate analysis.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                4
              </span>
              <p>
                <strong className="text-gray-900">Privacy:</strong> Your data is
                encrypted and secure. We never share your financial information.
              </p>
            </div>
          </div>
        </div>

        {/* Supported formats */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <svg
              className="h-5 w-5 text-blue-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium">Supported file formats:</p>
              <p className="mt-1">
                CSV (.csv), Excel 2007+ (.xlsx), Excel 97-2003 (.xls)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
