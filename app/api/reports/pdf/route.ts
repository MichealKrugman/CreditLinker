import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import prisma from "@/lib/database/prisma";
import { calculateIdentityScore } from "@/lib/scoring/algorithm";
import { calculateRevenueMetrics } from "@/lib/metrics/revenue";
import { calculateExpenseMetrics } from "@/lib/metrics/expenses";
import { calculateCashflowMetrics } from "@/lib/metrics/cashflow";

/**
 * GET /api/reports/pdf
 * Generate a bank-ready PDF cashflow report
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.businessId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const businessId = session.user.businessId;

    // Fetch business details
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        industry: true,
        createdAt: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 }
      );
    }

    // Fetch all transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        import: {
          businessId,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    if (transactions.length === 0) {
      return NextResponse.json(
        { success: false, error: "No transactions found" },
        { status: 404 }
      );
    }

    // Calculate all metrics
    const revenueMetrics = await calculateRevenueMetrics(businessId);
    const expenseMetrics = await calculateExpenseMetrics(businessId);
    const cashflowMetrics = await calculateCashflowMetrics(businessId);
    const scoreData = await calculateIdentityScore(businessId);

    // Prepare report data
    const reportData = {
      business: {
        name: business.name,
        industry: business.industry,
        generatedAt: new Date().toISOString(),
      },
      score: {
        overall: scoreData.score,
        grade: scoreData.interpretation.grade,
        label: scoreData.interpretation.label,
        components: scoreData.components,
      },
      revenue: {
        total: revenueMetrics.totalRevenue,
        monthly: revenueMetrics.monthlyRevenue,
        growth: revenueMetrics.averageGrowthRate,
        consistency: revenueMetrics.consistencyScore,
      },
      expenses: {
        total: expenseMetrics.totalExpenses,
        monthly: expenseMetrics.monthlyExpenses,
        volatility: expenseMetrics.volatilityScore,
        breakdown: expenseMetrics.expenseBreakdown,
      },
      cashflow: {
        net: cashflowMetrics.averageMonthlyCashflow,
        monthly: cashflowMetrics.monthlyCashflow,
        buffer: cashflowMetrics.cashflowBuffer,
        trend: cashflowMetrics.trend,
      },
      transactions: transactions.slice(0, 50), // Last 50 transactions
    };

    // Note: In a production environment, you would use a PDF generation library
    // like puppeteer, jspdf, or pdfkit here. For now, we'll return the data
    // as JSON and let the frontend handle PDF generation.
    
    return NextResponse.json({
      success: true,
      data: reportData,
      message: "PDF generation data prepared. Frontend should use jspdf to generate PDF.",
    });
  } catch (error) {
    console.error("Error generating PDF report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate PDF report" },
      { status: 500 }
    );
  }
}
