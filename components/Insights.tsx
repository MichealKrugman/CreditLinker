"use client";

import { AlertCircle, TrendingUp, AlertTriangle, Info, CheckCircle } from "lucide-react";

export interface InsightItem {
  type: "positive" | "negative" | "neutral" | "warning";
  title: string;
  message: string;
  recommendation?: string;
}

interface InsightsProps {
  insights: InsightItem[];
  maxDisplay?: number;
}

export function Insights({ insights, maxDisplay = 5 }: InsightsProps) {
  const displayedInsights = insights.slice(0, maxDisplay);

  const getIcon = (type: InsightItem["type"]) => {
    switch (type) {
      case "positive":
        return <CheckCircle className="text-green-600" size={20} />;
      case "negative":
        return <AlertCircle className="text-red-600" size={20} />;
      case "warning":
        return <AlertTriangle className="text-yellow-600" size={20} />;
      case "neutral":
      default:
        return <Info className="text-blue-600" size={20} />;
    }
  };

  const getBgColor = (type: InsightItem["type"]) => {
    switch (type) {
      case "positive":
        return "bg-green-50 border-green-200";
      case "negative":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "neutral":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  if (displayedInsights.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <TrendingUp className="mx-auto mb-3 text-gray-400" size={48} />
        <p className="text-gray-500">No insights available yet. Upload transaction data to see insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Business Insights</h2>
        {insights.length > maxDisplay && (
          <span className="text-sm text-gray-500">
            Showing {maxDisplay} of {insights.length}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {displayedInsights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getBgColor(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{getIcon(insight.type)}</div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">{insight.title}</h3>
                <p className="text-sm text-gray-700 mb-2">{insight.message}</p>
                {insight.recommendation && (
                  <div className="bg-white/60 rounded px-3 py-2 mt-2">
                    <p className="text-sm font-medium text-gray-800">
                      💡 Recommendation: {insight.recommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
