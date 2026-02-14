"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  cashflow: number;
}

interface TrendChartProps {
  data: MonthlyData[];
  title?: string;
  defaultView?: "revenue" | "expenses" | "cashflow" | "all";
}

export function TrendChart({ data, title = "Financial Trends", defaultView = "all" }: TrendChartProps) {
  const [view, setView] = useState<"revenue" | "expenses" | "cashflow" | "all">(defaultView);
  const [chartType, setChartType] = useState<"line" | "area">("area");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const ChartComponent = chartType === "area" ? AreaChart : LineChart;
    const DataComponent = chartType === "area" ? Area : Line;

    return (
      <ResponsiveContainer width="100%" height={350}>
        <ChartComponent data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCashflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 14 }}
            iconType="circle"
          />

          {(view === "revenue" || view === "all") && (
            <DataComponent
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#10b981"
              strokeWidth={2}
              fill={chartType === "area" ? "url(#colorRevenue)" : undefined}
              dot={{ fill: "#10b981", r: 4 }}
            />
          )}

          {(view === "expenses" || view === "all") && (
            <DataComponent
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#ef4444"
              strokeWidth={2}
              fill={chartType === "area" ? "url(#colorExpenses)" : undefined}
              dot={{ fill: "#ef4444", r: 4 }}
            />
          )}

          {(view === "cashflow" || view === "all") && (
            <DataComponent
              type="monotone"
              dataKey="cashflow"
              name="Cashflow"
              stroke="#3b82f6"
              strokeWidth={2}
              fill={chartType === "area" ? "url(#colorCashflow)" : undefined}
              dot={{ fill: "#3b82f6", r: 4 }}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            {["all", "revenue", "expenses", "cashflow"].map((option) => (
              <button
                key={option}
                onClick={() => setView(option as typeof view)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  view === option
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setChartType("area")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === "area"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === "line"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Line
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[350px] text-gray-500">
          <p>No data available for the selected period</p>
        </div>
      ) : (
        renderChart()
      )}
    </div>
  );
}
