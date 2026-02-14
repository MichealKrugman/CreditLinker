import { RevenueMetrics } from '../metrics/revenue';
import { ExpenseMetrics } from '../metrics/expenses';
import { CashflowMetrics, identifyCashflowTrends } from '../metrics/cashflow';
import { InventoryMetrics } from './inventory-analysis';
import { formatCurrency } from '@/lib/utils';

export interface BusinessInsight {
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  recommendation?: string;
}

/**
 * Generate comprehensive business insights from all metrics
 */
export function generateBusinessInsights(
  revenueMetrics: RevenueMetrics,
  expenseMetrics: ExpenseMetrics,
  cashflowMetrics: CashflowMetrics,
  inventoryMetrics?: InventoryMetrics
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  // Revenue insights
  insights.push(...generateRevenueInsights(revenueMetrics));

  // Expense insights
  insights.push(...generateExpenseInsights(expenseMetrics));

  // Cashflow insights
  insights.push(...generateCashflowInsights(cashflowMetrics));

  // Inventory insights (pharmacy-specific)
  if (inventoryMetrics) {
    insights.push(...generateInventoryInsights(inventoryMetrics));
  }

  // Sort by severity (danger > warning > info > success)
  const severityOrder = { danger: 0, warning: 1, info: 2, success: 3 };
  return insights.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);
}

/**
 * Generate revenue-related insights
 */
export function generateRevenueInsights(
  revenueMetrics: RevenueMetrics
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  // Revenue growth insight
  if (revenueMetrics.growthRate > 10) {
    insights.push({
      type: 'success',
      title: 'Strong Revenue Growth',
      message: `Your revenue is growing at ${revenueMetrics.growthRate.toFixed(1)}% per month on average. This is excellent momentum!`,
      recommendation: 'Consider scaling operations to capitalize on this growth trend.',
    });
  } else if (revenueMetrics.growthRate < -10) {
    insights.push({
      type: 'danger',
      title: 'Revenue Declining',
      message: `Revenue is declining by ${Math.abs(revenueMetrics.growthRate).toFixed(1)}% per month. Immediate attention needed.`,
      recommendation:
        'Review customer retention, pricing strategy, and competitive positioning. Consider launching promotions or new services.',
    });
  } else if (revenueMetrics.growthRate < 0) {
    insights.push({
      type: 'warning',
      title: 'Slight Revenue Decline',
      message: `Revenue is down ${Math.abs(revenueMetrics.growthRate).toFixed(1)}% per month. Monitor closely.`,
      recommendation:
        'Identify causes of decline and implement corrective measures before it becomes a trend.',
    });
  }

  // Revenue consistency insight
  if (revenueMetrics.consistency > 80) {
    insights.push({
      type: 'success',
      title: 'Highly Consistent Revenue',
      message: `Revenue consistency score of ${revenueMetrics.consistency}/100 indicates stable, predictable income.`,
    });
  } else if (revenueMetrics.consistency < 60) {
    insights.push({
      type: 'warning',
      title: 'Inconsistent Revenue',
      message: `Revenue varies significantly month-to-month (consistency: ${revenueMetrics.consistency}/100).`,
      recommendation:
        'Work on building recurring revenue streams and stabilizing customer base to improve predictability.',
    });
  }

  // Revenue trend insight
  if (revenueMetrics.trend === 'increasing') {
    insights.push({
      type: 'info',
      title: 'Positive Trend',
      message: 'Revenue trend is positive with recent months showing improvement over earlier periods.',
    });
  } else if (revenueMetrics.trend === 'decreasing') {
    insights.push({
      type: 'warning',
      title: 'Declining Trend',
      message: 'Revenue trend is concerning with recent months underperforming compared to earlier periods.',
      recommendation: 'Investigate root causes and develop strategies to reverse this trend.',
    });
  }

  return insights;
}

/**
 * Generate expense-related insights
 */
export function generateExpenseInsights(
  expenseMetrics: ExpenseMetrics
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  // Expense volatility insight
  if (expenseMetrics.volatility > 40) {
    insights.push({
      type: 'warning',
      title: 'High Expense Volatility',
      message: `Expenses fluctuate significantly (volatility: ${expenseMetrics.volatility}/100), making budgeting difficult.`,
      recommendation:
        'Review variable costs and negotiate fixed-price contracts where possible. Identify and eliminate irregular large expenses.',
    });
  } else if (expenseMetrics.volatility < 20) {
    insights.push({
      type: 'success',
      title: 'Well-Controlled Expenses',
      message: `Low expense volatility (${expenseMetrics.volatility}/100) indicates good cost management and predictability.`,
    });
  }

  // Top expense category insights
  if (expenseMetrics.topCategories.length > 0) {
    const topCategory = expenseMetrics.topCategories[0];

    if (topCategory.percentage > 50) {
      insights.push({
        type: 'warning',
        title: 'Concentrated Expense Category',
        message: `${topCategory.category} accounts for ${topCategory.percentage.toFixed(1)}% of total expenses (${formatCurrency(topCategory.amount)}).`,
        recommendation:
          'Consider diversifying suppliers or negotiating better rates for this major expense category.',
      });
    }

    // Inventory-specific insight
    if (topCategory.category === 'INVENTORY' && topCategory.percentage < 40) {
      insights.push({
        type: 'warning',
        title: 'Low Inventory Investment',
        message: `Inventory is only ${topCategory.percentage.toFixed(1)}% of expenses. This may limit revenue growth for a pharmacy.`,
        recommendation:
          'Consider increasing inventory investment to expand product offerings and revenue potential.',
      });
    }
  }

  return insights;
}

/**
 * Generate cashflow-related insights
 */
export function generateCashflowInsights(
  cashflowMetrics: CashflowMetrics
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  // Overall cashflow health
  if (cashflowMetrics.netCashflow > 0) {
    insights.push({
      type: 'success',
      title: 'Positive Net Cashflow',
      message: `Total net cashflow of ${formatCurrency(cashflowMetrics.netCashflow)} indicates healthy financial position.`,
    });
  } else {
    insights.push({
      type: 'danger',
      title: 'Negative Net Cashflow',
      message: `Total net cashflow is ${formatCurrency(Math.abs(cashflowMetrics.netCashflow))} in the red. Action required.`,
      recommendation:
        'Urgently review expenses and implement revenue growth strategies. Consider cost-cutting measures.',
    });
  }

  // Positive months percentage
  if (cashflowMetrics.positiveMonthsPercentage > 80) {
    insights.push({
      type: 'success',
      title: 'Consistently Positive',
      message: `${cashflowMetrics.positiveMonthsPercentage.toFixed(0)}% of months had positive cashflow. Excellent consistency!`,
    });
  } else if (cashflowMetrics.positiveMonthsPercentage < 50) {
    insights.push({
      type: 'danger',
      title: 'Frequent Negative Cashflow',
      message: `Only ${cashflowMetrics.positiveMonthsPercentage.toFixed(0)}% of months were cashflow positive. This is unsustainable.`,
      recommendation:
        'Immediate action needed to improve cashflow. Focus on increasing revenue and reducing discretionary expenses.',
    });
  }

  // Cashflow buffer insight
  if (cashflowMetrics.cashflowBuffer > 60) {
    insights.push({
      type: 'success',
      title: 'Strong Cash Reserves',
      message: `You have ${cashflowMetrics.cashflowBuffer} days of expense coverage. Great financial cushion!`,
    });
  } else if (cashflowMetrics.cashflowBuffer < 30) {
    insights.push({
      type: 'warning',
      title: 'Low Cash Reserves',
      message: `Only ${cashflowMetrics.cashflowBuffer} days of expenses covered. Build emergency reserves.`,
      recommendation:
        'Aim to save 3-6 months of operating expenses as a safety buffer. Set aside a portion of profits each month.',
    });
  }

  // Trend analysis
  const trends = identifyCashflowTrends(cashflowMetrics.monthlyCashflow);

  if (trends.trend === 'improving') {
    insights.push({
      type: 'success',
      title: 'Improving Cashflow Trend',
      message: 'Your cashflow is trending positively over recent months. Keep up the good work!',
    });
  } else if (trends.trend === 'declining') {
    insights.push({
      type: 'warning',
      title: 'Declining Cashflow Trend',
      message: 'Cashflow is trending downward. Monitor closely and take corrective action.',
      recommendation:
        'Analyze what changed in recent months and address any revenue drops or expense increases.',
    });
  }

  // Runway warning
  if (
    cashflowMetrics.runwayMonths < 6 &&
    cashflowMetrics.runwayMonths > 0 &&
    cashflowMetrics.burnRate > 0
  ) {
    insights.push({
      type: 'danger',
      title: 'Limited Runway',
      message: `At current burn rate, you have approximately ${cashflowMetrics.runwayMonths} months of runway remaining.`,
      recommendation:
        'Urgently increase revenue or reduce expenses to extend runway. Explore financing options if needed.',
    });
  }

  return insights;
}

/**
 * Generate inventory-related insights (pharmacy-specific)
 */
function generateInventoryInsights(
  inventoryMetrics: InventoryMetrics
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  // Inventory as % of revenue
  if (inventoryMetrics.inventoryAsPercentageOfRevenue > 0) {
    if (inventoryMetrics.inventoryAsPercentageOfRevenue > 70) {
      insights.push({
        type: 'warning',
        title: 'High Inventory Cost',
        message: `Inventory represents ${inventoryMetrics.inventoryAsPercentageOfRevenue.toFixed(1)}% of revenue. This may indicate overstocking or pricing issues.`,
        recommendation:
          'Review inventory levels, negotiate better supplier terms, or consider price increases to improve margins.',
      });
    } else if (inventoryMetrics.inventoryAsPercentageOfRevenue < 40) {
      insights.push({
        type: 'info',
        title: 'Healthy Inventory Ratio',
        message: `Inventory at ${inventoryMetrics.inventoryAsPercentageOfRevenue.toFixed(1)}% of revenue indicates good margin management.`,
      });
    }
  }

  // Restocking pattern
  if (inventoryMetrics.restockingPattern.consistency === 'regular') {
    insights.push({
      type: 'success',
      title: 'Regular Restocking Schedule',
      message: `You restock every ~${inventoryMetrics.restockingPattern.averageFrequency} days on average with good consistency.`,
    });
  } else {
    insights.push({
      type: 'info',
      title: 'Irregular Restocking',
      message: `Restocking pattern varies. Average frequency is ${inventoryMetrics.restockingPattern.averageFrequency} days but it's inconsistent.`,
      recommendation:
        'Consider establishing a more regular ordering schedule for better inventory management.',
    });
  }

  // Next restock prediction
  if (inventoryMetrics.restockingPattern.daysSinceLastRestock > 0) {
    const daysUntilNext =
      inventoryMetrics.restockingPattern.averageFrequency -
      inventoryMetrics.restockingPattern.daysSinceLastRestock;

    if (daysUntilNext <= 0) {
      insights.push({
        type: 'info',
        title: 'Restock Due',
        message: `Based on your ${inventoryMetrics.restockingPattern.averageFrequency}-day cycle, a restock order may be due soon.`,
      });
    }
  }

  // Inventory turnover
  if (inventoryMetrics.inventoryTurnoverEstimate > 0) {
    if (inventoryMetrics.inventoryTurnoverEstimate > 12) {
      insights.push({
        type: 'success',
        title: 'Excellent Inventory Turnover',
        message: `Inventory turns over approximately ${inventoryMetrics.inventoryTurnoverEstimate} times per year. This indicates efficient inventory management.`,
      });
    } else if (inventoryMetrics.inventoryTurnoverEstimate < 6) {
      insights.push({
        type: 'warning',
        title: 'Low Inventory Turnover',
        message: `Inventory turns only ${inventoryMetrics.inventoryTurnoverEstimate} times per year. You may be overstocking.`,
        recommendation:
          'Review slow-moving items and adjust ordering quantities to improve turnover rate.',
      });
    }
  }

  // Top suppliers
  if (inventoryMetrics.topSuppliers.length > 0) {
    const topSupplier = inventoryMetrics.topSuppliers[0];

    if (topSupplier.percentage > 60) {
      insights.push({
        type: 'warning',
        title: 'Supplier Concentration Risk',
        message: `${topSupplier.name} accounts for ${topSupplier.percentage.toFixed(1)}% of inventory purchases (${formatCurrency(topSupplier.totalSpent)}).`,
        recommendation:
          'Consider diversifying suppliers to reduce dependency and improve negotiating leverage.',
      });
    }
  }

  return insights;
}
