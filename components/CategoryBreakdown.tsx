"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

interface CategoryBreakdownProps {
  data: CategoryData[];
  title?: string;
  total?: number;
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

export function CategoryBreakdown({
  data,
  title = "Expense Breakdown",
  total,
}: CategoryBreakdownProps) {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-2">{data.category}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(data.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-600">Percentage:</span>
              <span className="font-medium text-gray-900">
                {data.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderLabel = (entry: any) => {
    return `${entry.percentage.toFixed(0)}%`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {total !== undefined && (
            <p className="text-sm text-gray-500 mt-1">
              Total: {formatCurrency(total)}
            </p>
          )}
        </div>

        {/* Chart Type Toggle */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setChartType("pie")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              chartType === "pie"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Pie Chart
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              chartType === "bar"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Bar Chart
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[350px] text-gray-500">
          <p>No category data available</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div>
            {chartType === "pie" ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={renderLabel}
                    labelLine={false}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {data.map((entry, index) => (
              <div
                key={entry.category}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {entry.category}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(entry.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
