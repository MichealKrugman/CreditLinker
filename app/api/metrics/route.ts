import { NextRequest, NextResponse } from 'next/server';
import { getBusinessId } from '@/lib/auth/session';
import { calculateRevenueMetrics } from '@/lib/metrics/revenue';
import { calculateExpenseMetrics } from '@/lib/metrics/expenses';
import { calculateCashflowMetrics } from '@/lib/metrics/cashflow';
import { analyzeInventory } from '@/lib/pharmacy/inventory-analysis';
import { generateBusinessInsights } from '@/lib/pharmacy/insights';
import { cached } from '@/lib/cache/redis';

/**
 * GET /api/metrics
 * Calculate and return all financial metrics
 */
export async function GET(request: NextRequest) {
  try {
    const businessId = await getBusinessId();

    // Get query parameters for date range
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    // Cache key based on business and date range
    const cacheKey = `metrics:${businessId}:${startDateParam || 'all'}:${endDateParam || 'all'}`;

    // Use cached function to memoize expensive calculations
    const metrics = await cached(
      cacheKey,
      async () => {
        // Calculate all metrics in parallel
        const [revenueMetrics, expenseMetrics, cashflowMetrics, inventoryMetrics] =
          await Promise.all([
            calculateRevenueMetrics(businessId, startDate, endDate),
            calculateExpenseMetrics(businessId, startDate, endDate),
            calculateCashflowMetrics(businessId, startDate, endDate),
            analyzeInventory(businessId, startDate, endDate),
          ]);

        // Generate insights
        const insights = generateBusinessInsights(
          revenueMetrics,
          expenseMetrics,
          cashflowMetrics,
          inventoryMetrics
        );

        return {
          revenue: revenueMetrics,
          expenses: expenseMetrics,
          cashflow: cashflowMetrics,
          inventory: inventoryMetrics,
          insights,
        };
      },
      3600 // Cache for 1 hour
    );

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Metrics calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate metrics',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/metrics
 * Clear cached metrics (useful after new data upload)
 */
export async function DELETE(request: NextRequest) {
  try {
    const businessId = await getBusinessId();

    const { del } = await import('@/lib/cache/redis');

    // Delete all cached metrics for this business
    // Use pattern matching to clear all date range variations
    await del(`metrics:${businessId}:*`);

    return NextResponse.json({
      success: true,
      message: 'Metrics cache cleared',
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cache',
      },
      { status: 500 }
    );
  }
}
