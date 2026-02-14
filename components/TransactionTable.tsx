"use client";

import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download, Filter } from "lucide-react";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onExport?: () => void;
}

type SortField = "date" | "amount" | "category";
type SortDirection = "asc" | "desc";

export function TransactionTable({ transactions, onExport }: TransactionTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(transactions.map((t) => t.category)))];

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || transaction.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "amount":
        comparison = a.amount - b.amount;
        break;
      case "category":
        comparison = a.category.localeCompare(b.category);
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Paginate
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Income: "bg-green-100 text-green-700",
      Salary: "bg-green-100 text-green-700",
      Expenses: "bg-red-100 text-red-700",
      "Cost of Goods": "bg-orange-100 text-orange-700",
      Inventory: "bg-purple-100 text-purple-700",
      Utilities: "bg-blue-100 text-blue-700",
      Transfer: "bg-gray-100 text-gray-700",
      Other: "bg-yellow-100 text-yellow-700",
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={16} className="text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={16} className="text-blue-600" />
    ) : (
      <ArrowDown size={16} className="text-blue-600" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>

          {/* Export Button */}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={20} />
              Export CSV
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedTransactions.length)} of{" "}
          {sortedTransactions.length} transactions
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-2">
                  Date
                  <SortIcon field="date" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Description
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center gap-2">
                  Category
                  <SortIcon field="category" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end gap-2">
                  Amount
                  <SortIcon field="amount" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs truncate">{transaction.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      transaction.category
                    )}`}
                  >
                    {transaction.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  <span
                    className={
                      transaction.type === "CREDIT" ? "text-green-600" : "text-red-600"
                    }
                  >
                    {transaction.type === "CREDIT" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedTransactions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No transactions found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
