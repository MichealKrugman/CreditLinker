"use client";

import { TrendingUp, TrendingDown, DollarSign, Minus, Activity } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow" | "purple";
}

interface MetricsCardsProps {
  revenue?: {
    total: number;
    growth: number;
    consistency: number;
  };
  expenses?: {
    total: number;
    volatility: number;
  };
  cashflow?: {
    net: number;
    buffer: number;
  };
}

function MetricCard({ title, value, subtitle, trend, icon, color = "blue" }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp size={16} className="text-green-600" />;
    if (trend.value < 0) return <TrendingDown size={16} className="text-red-600" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-green-600";
    if (trend.value < 0) return "text-red-600";
    return "text-gray-500";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {trend.value > 0 ? "+" : ""}{trend.value.toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

export function MetricsCards({ revenue, expenses, cashflow }: MetricsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Revenue Card */}
      {revenue && (
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(revenue.total)}
          subtitle={`Consistency: ${revenue.consistency.toFixed(0)}%`}
          trend={{
            value: revenue.growth,
            label: "vs last month",
          }}
          icon={<DollarSign size={24} />}
          color="green"
        />
      )}

      {/* Expenses Card */}
      {expenses && (
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(expenses.total)}
          subtitle={`Volatility: ${expenses.volatility.toFixed(0)}%`}
          trend={{
            value: -expenses.volatility, // Negative volatility is good
            label: "volatility score",
          }}
          icon={<Activity size={24} />}
          color="red"
        />
      )}

      {/* Cashflow Card */}
      {cashflow && (
        <MetricCard
          title="Net Cashflow"
          value={formatCurrency(cashflow.net)}
          subtitle={`${cashflow.buffer.toFixed(0)} days buffer`}
          trend={
            cashflow.net > 0
              ? { value: 100, label: "positive flow" }
              : { value: -100, label: "negative flow" }
          }
          icon={<TrendingUp size={24} />}
          color={cashflow.net > 0 ? "blue" : "yellow"}
        />
      )}
    </div>
  );
}
