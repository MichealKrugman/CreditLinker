"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TransactionTable, Transaction } from "@/components/TransactionTable";
import { Loader2, AlertCircle, RefreshCw, FileText } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/transactions");

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error("Invalid response from server");
      }

      setTransactions(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/reports/csv");

      if (!response.ok) {
        throw new Error("Failed to export transactions");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export transactions. Please try again.");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to Load Transactions
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchTransactions}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={20} />
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (transactions.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Transactions Found
            </h2>
            <p className="text-gray-600 mb-6">
              Upload transaction data to see your transaction history.
            </p>
            <a
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Data
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
        <p className="text-gray-600">
          Browse and analyze your transaction history
        </p>
      </div>

      {/* Transaction Table */}
      <TransactionTable transactions={transactions} onExport={handleExport} />
    </DashboardLayout>
  );
}
