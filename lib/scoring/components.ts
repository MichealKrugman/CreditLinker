import { MonthlyCashflow } from '../metrics/cashflow';
import { MonthlyRevenue } from '../metrics/revenue';
import { MonthlyExpenses } from '../metrics/expenses';

/**
 * Calculate Positivity Score (0-100)
 * Weight: 30% of total score
 * 
 * Measures the percentage of months with positive cashflow
 */
export function calculatePositivityScore(
  monthlyCashflow: MonthlyCashflow[]
): number {
  if (monthlyCashflow.length === 0) {
    return 0;
  }

  const positiveMonths = monthlyCashflow.filter((m) => m.isPositive).length;
  const percentage = (positiveMonths / monthlyCashflow.length) * 100;

  return Math.round(percentage);
}

/**
 * Calculate Stability Score (0-100)
 * Weight: 20% of total score
 * 
 * Measures revenue consistency (low variance = high stability)
 */
export function calculateStabilityScore(monthlyRevenue: MonthlyRevenue[]): number {
  if (monthlyRevenue.length < 2) {
    return 100; // Perfect stability with only one month
  }

  const revenues = monthlyRevenue.map((m) => m.revenue);
  const mean = revenues.reduce((sum, val) => sum + val, 0) / revenues.length;

  // Calculate coefficient of variation
  const variance =
    revenues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    revenues.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  // Convert CV to score (0-100)
  // CV of 0% = score 100 (perfect stability)
  // CV of 50% = score 50
  // CV of 100%+ = score 0 (very unstable)
  const score = Math.max(0, Math.min(100, 100 - cv));

  return Math.round(score);
}

/**
 * Calculate Growth Score (0-100)
 * Weight: 20% of total score
 * 
 * Measures revenue growth trend (positive growth = higher score)
 */
export function calculateGrowthScore(
  monthlyRevenue: MonthlyRevenue[],
  growthRate: number
): number {
  if (monthlyRevenue.length < 2) {
    return 50; // Neutral score with insufficient data
  }

  // Growth rate is in percentage (e.g., 5.2 = 5.2% growth)
  // Map growth rate to score:
  // -20% or worse = 0
  // 0% = 50 (neutral)
  // +20% or better = 100

  let score: number;

  if (growthRate >= 20) {
    score = 100;
  } else if (growthRate <= -20) {
    score = 0;
  } else {
    // Linear mapping: -20% to +20% maps to 0-100
    score = ((growthRate + 20) / 40) * 100;
  }

  return Math.round(score);
}

/**
 * Calculate Expense Control Score (0-100)
 * Weight: 15% of total score
 * 
 * Measures expense volatility (low volatility = better control)
 */
export function calculateExpenseControlScore(
  monthlyExpenses: MonthlyExpenses[]
): number {
  if (monthlyExpenses.length < 2) {
    return 100; // Perfect control with only one month
  }

  const expenses = monthlyExpenses.map((m) => m.expenses);
  const mean = expenses.reduce((sum, val) => sum + val, 0) / expenses.length;

  // Calculate coefficient of variation
  const variance =
    expenses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    expenses.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  // Convert CV to score (0-100)
  // CV of 0% = score 100 (perfect control)
  // CV of 30% = score 70
  // CV of 100%+ = score 0 (poor control)
  const score = Math.max(0, Math.min(100, 100 - cv));

  return Math.round(score);
}

/**
 * Calculate Buffer Score (0-100)
 * Weight: 15% of total score
 * 
 * Measures cash reserves (days of expenses covered)
 */
export function calculateBufferScore(
  cashflowBuffer: number,
  averageMonthlyCashflow: number
): number {
  // Buffer is in days
  // Map days to score:
  // 0 days = 0
  // 30 days (1 month) = 50
  // 90 days (3 months) = 100

  let score: number;

  if (cashflowBuffer >= 90) {
    score = 100;
  } else if (cashflowBuffer <= 0) {
    score = 0;
  } else {
    // Linear mapping: 0-90 days maps to 0-100
    score = (cashflowBuffer / 90) * 100;
  }

  // Bonus: If average monthly cashflow is positive, add up to 10 bonus points
  if (averageMonthlyCashflow > 0) {
    const bonus = Math.min(10, (averageMonthlyCashflow / 10000) * 5);
    score = Math.min(100, score + bonus);
  }

  return Math.round(score);
}

/**
 * Get score interpretation and color
 */
export function getScoreInterpretation(score: number): {
  grade: string;
  label: string;
  color: string;
  description: string;
} {
  if (score >= 90) {
    return {
      grade: 'A+',
      label: 'Excellent',
      color: '#10b981', // green-500
      description: 'Outstanding financial health with strong stability and growth',
    };
  } else if (score >= 80) {
    return {
      grade: 'A',
      label: 'Very Good',
      color: '#22c55e', // green-400
      description: 'Strong financial position with consistent performance',
    };
  } else if (score >= 70) {
    return {
      grade: 'B',
      label: 'Good',
      color: '#84cc16', // lime-500
      description: 'Healthy finances with room for improvement',
    };
  } else if (score >= 60) {
    return {
      grade: 'C',
      label: 'Fair',
      color: '#eab308', // yellow-500
      description: 'Moderate financial health, needs attention in some areas',
    };
  } else if (score >= 50) {
    return {
      grade: 'D',
      label: 'Below Average',
      color: '#f97316', // orange-500
      description: 'Financial challenges present, improvement needed',
    };
  } else {
    return {
      grade: 'F',
      label: 'Poor',
      color: '#ef4444', // red-500
      description: 'Significant financial concerns requiring immediate action',
    };
  }
}

/**
 * Generate actionable recommendations based on component scores
 */
export function generateRecommendations(components: {
  positivity: number;
  stability: number;
  growth: number;
  expenseControl: number;
  buffer: number;
}): string[] {
  const recommendations: string[] = [];

  // Positivity recommendations
  if (components.positivity < 60) {
    recommendations.push(
      'Focus on improving monthly cashflow positivity by increasing revenue or reducing expenses'
    );
  }

  // Stability recommendations
  if (components.stability < 70) {
    recommendations.push(
      'Work on revenue stability by diversifying income streams and building recurring revenue'
    );
  }

  // Growth recommendations
  if (components.growth < 60) {
    recommendations.push(
      'Implement growth strategies such as marketing campaigns or expanding product offerings'
    );
  }

  // Expense control recommendations
  if (components.expenseControl < 70) {
    recommendations.push(
      'Review and stabilize monthly expenses by negotiating better supplier contracts or cutting unnecessary costs'
    );
  }

  // Buffer recommendations
  if (components.buffer < 50) {
    recommendations.push(
      'Build cash reserves by saving a portion of positive cashflow months to create a financial cushion'
    );
  }

  // If all scores are good
  if (recommendations.length === 0) {
    recommendations.push(
      'Maintain your excellent financial discipline and continue monitoring key metrics'
    );
    recommendations.push(
      'Consider expanding operations or investing in growth opportunities'
    );
  }

  return recommendations;
}
