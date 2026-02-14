"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TrendChart } from "@/components/TrendChart";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { Loader2, AlertCircle, RefreshCw, TrendingUp } from "lucide-react";

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  cashflow: number;
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

interface AnalyticsData {
  monthlyTrends: MonthlyData[];
  expenseCategories: CategoryData[];
  totalExpenses: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/metrics");

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error("Invalid response from server");
      }

      // Transform metrics data into chart format
      const monthlyRevenue = result.data.revenue.monthlyRevenue || [];
      const monthlyExpenses = result.data.expenses.monthlyExpenses || [];
      const monthlyCashflow = result.data.cashflow.monthlyCashflow || [];

      // Combine all months
      const allMonths = new Set([
        ...monthlyRevenue.map((m: any) => m.month),
        ...monthlyExpenses.map((m: any) => m.month),
        ...monthlyCashflow.map((m: any) => m.month),
      ]);

      const monthlyTrends: MonthlyData[] = Array.from(allMonths)
        .sort()
        .map((month) => {
          const revenueData = monthlyRevenue.find((m: any) => m.month === month);
          const expenseData = monthlyExpenses.find((m: any) => m.month === month);
          const cashflowData = monthlyCashflow.find((m: any) => m.month === month);

          return {
            month: month as string,
            revenue: revenueData?.totalRevenue || 0,
            expenses: expenseData?.totalExpenses || 0,
            cashflow: cashflowData?.netCashflow || 0,
          };
        });

      // Get expense breakdown
      const expenseBreakdown = result.data.expenses.expenseBreakdown || {};
      const totalExpenses = result.data.expenses.totalExpenses || 0;

      const expenseCategories: CategoryData[] = Object.entries(expenseBreakdown)
        .map(([category, amount]) => ({
          category,
          amount: amount as number,
          percentage: ((amount as number) / totalExpenses) * 100,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Get date range
      const transactions = await fetch("/api/transactions?limit=1").then((r) => r.json());
      const dateRange = {
        start: transactions.data?.[0]?.date || "N/A",
        end: new Date().toISOString().split("T")[0],
      };

      setData({
        monthlyTrends,
        expenseCategories,
        totalExpenses,
        dateRange,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
            <p className="text-gray-600">Loading analytics...</p>
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
              Unable to Load Analytics
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchAnalyticsData}
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

  if (!data || data.monthlyTrends.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <TrendingUp className="mx-auto mb-4 text-gray-400" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Analytics Data
            </h2>
            <p className="text-gray-600 mb-6">
              Upload transaction data to see detailed analytics and trends.
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">
          Detailed financial insights and trends
          {data.dateRange.start !== "N/A" && (
            <span className="ml-2 text-sm">
              ({data.dateRange.start} to {data.dateRange.end})
            </span>
          )}
        </p>
      </div>

      {/* Charts Grid */}
      <div className="space-y-8">
        {/* Monthly Trends */}
        <TrendChart
          data={data.monthlyTrends}
          title="Monthly Financial Trends"
          defaultView="all"
        />

        {/* Expense Breakdown */}
        {data.expenseCategories.length > 0 && (
          <CategoryBreakdown
            data={data.expenseCategories}
            title="Expense Category Breakdown"
            total={data.totalExpenses}
          />
        )}

        {/* Key Metrics Summary */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Average Monthly Revenue
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: "NGN",
                minimumFractionDigits: 0,
              }).format(
                data.monthlyTrends.reduce((sum, m) => sum + m.revenue, 0) /
                  data.monthlyTrends.length
              )}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Across {data.monthlyTrends.length} months
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Average Monthly Expenses
            </h3>
            <p className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: "NGN",
                minimumFractionDigits: 0,
              }).format(
                data.monthlyTrends.reduce((sum, m) => sum + m.expenses, 0) /
                  data.monthlyTrends.length
              )}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Across {data.monthlyTrends.length} months
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Average Monthly Cashflow
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: "NGN",
                minimumFractionDigits: 0,
              }).format(
                data.monthlyTrends.reduce((sum, m) => sum + m.cashflow, 0) /
                  data.monthlyTrends.length
              )}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Across {data.monthlyTrends.length} months
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
