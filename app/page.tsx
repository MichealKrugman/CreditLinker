import Link from 'next/link'
import { ArrowRight, BarChart3, FileText, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">CreditLinker</h1>
          <div className="space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-primary-600">
              Login
            </Link>
            <Link href="/signup" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Financial Intelligence for Your Pharmacy Business
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Transform your transaction data into actionable insights. 
            Get your Financial Identity Score and understand your business health.
          </p>
          <Link href="/signup" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
            Start Free Analysis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <div className="card text-center">
            <FileText className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Easy Upload</h3>
            <p className="text-gray-600">
              Upload your bank statements (CSV/Excel) and we'll handle the rest
            </p>
          </div>

          <div className="card text-center">
            <BarChart3 className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Analysis</h3>
            <p className="text-gray-600">
              Get detailed insights on revenue, expenses, and cash flow patterns
            </p>
          </div>

          <div className="card text-center">
            <Shield className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Identity Score</h3>
            <p className="text-gray-600">
              Receive a 0-100 financial health score based on multiple factors
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <p className="text-center text-gray-600">
          © 2026 CreditLinker. Financial Intelligence Platform.
        </p>
      </footer>
    </div>
  )
}
