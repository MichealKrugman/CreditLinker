"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ScoreGauge } from "@/components/ScoreGauge";
import { MetricsCards } from "@/components/MetricsCards";
import { Insights, InsightItem } from "@/components/Insights";
import { ReportGenerator } from "@/components/ReportGenerator";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface DashboardData {
  score: {
    overall: number;
    components: {
      positivity: number;
      stability: number;
      growth: number;
      expenseControl: number;
      buffer: number;
    };
    interpretation: {
      grade: string;
      label: string;
      color: string;
      description: string;
    };
    recommendations: string[];
  };
  metrics: {
    revenue: {
      total: number;
      growth: number;
      consistency: number;
    };
    expenses: {
      total: number;
      volatility: number;
    };
    cashflow: {
      net: number;
      buffer: number;
    };
  };
  insights: InsightItem[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch score and metrics in parallel
      const [scoresRes, metricsRes] = await Promise.all([
        fetch("/api/scores"),
        fetch("/api/metrics"),
      ]);

      if (!scoresRes.ok || !metricsRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [scoresData, metricsData] = await Promise.all([
        scoresRes.json(),
        metricsRes.json(),
      ]);

      if (!scoresData.success || !metricsData.success) {
        throw new Error("Invalid response from server");
      }

      // Transform data into dashboard format
      const dashboardData: DashboardData = {
        score: {
          overall: scoresData.data.current.score,
          components: scoresData.data.current.components,
          interpretation: scoresData.data.current.interpretation,
          recommendations: scoresData.data.current.recommendations,
        },
        metrics: {
          revenue: {
            total: metricsData.data.revenue.totalRevenue,
            growth: metricsData.data.revenue.growthRate || 0,
            consistency: metricsData.data.revenue.consistency || 0,
          },
          expenses: {
            total: metricsData.data.expenses.totalExpenses,
            volatility: metricsData.data.expenses.volatility || 0,
          },
          cashflow: {
            net: metricsData.data.cashflow.averageMonthlyCashflow,
            buffer: metricsData.data.cashflow.cashflowBuffer || 0,
          },
        },
        insights: metricsData.data.insights || [],
      };

      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
            <p className="text-gray-600">Loading your dashboard...</p>
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
              Unable to Load Dashboard
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchDashboardData}
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

  if (!data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="mx-auto mb-4 text-yellow-500" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Data Available
            </h2>
            <p className="text-gray-600 mb-6">
              Upload transaction data to see your financial insights and identity score.
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's your financial overview.
        </p>
      </div>

      {/* Score Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left: Score Gauge */}
            <div className="flex justify-center lg:justify-start">
              <ScoreGauge score={data.score.overall} size="lg" />
            </div>

            {/* Right: Score Components */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Score Breakdown
              </h2>
              <div className="space-y-3">
                {data.score.components && Object.entries(data.score.components).map(([key, value]) => {
                  const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                  const percentage = (value / 100) * 100;
                  
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{label}</span>
                        <span className="text-gray-600">{value.toFixed(1)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Top Recommendations */}
              {data.score.recommendations && data.score.recommendations.length > 0 && (
                <div className="mt-6 p-4 bg-white/60 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    💡 Top Recommendation
                  </p>
                  <p className="text-sm text-gray-700">
                    {data.score.recommendations[0]}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="mb-8">
        <MetricsCards
          revenue={data.metrics.revenue}
          expenses={data.metrics.expenses}
          cashflow={data.metrics.cashflow}
        />
      </div>

      {/* Insights */}
      <div className="mb-8">
        <Insights insights={data.insights} maxDisplay={5} />
      </div>

      {/* Reports Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Reports & Exports</h2>
        <ReportGenerator />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <a
          href="/dashboard/transactions"
          className="block p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-2">View Transactions</h3>
          <p className="text-sm text-gray-600">
            Browse and analyze your transaction history
          </p>
        </a>
        <a
          href="/dashboard/analytics"
          className="block p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
          <p className="text-sm text-gray-600">
            View detailed financial trends and charts
          </p>
        </a>
        <a
          href="/dashboard/upload"
          className="block p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Upload New Data</h3>
          <p className="text-sm text-gray-600">
            Import more transaction data to improve accuracy
          </p>
        </a>
      </div>
    </DashboardLayout>
  );
}
