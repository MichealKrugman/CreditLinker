import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import prisma from "@/lib/database/prisma";

/**
 * GET /api/reports/csv
 * Export transactions as CSV
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");

    // Build query filters
    const where: any = {
      import: {
        businessId: session.user.businessId,
      },
    };

    if (category) {
      where.category = category;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Fetch all transactions
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        id: true,
        date: true,
        description: true,
        category: true,
        type: true,
        amount: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    // Generate CSV
    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const rows = transactions.map((t) => [
      new Date(t.date).toISOString().split("T")[0],
      `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
      t.category,
      t.type,
      t.amount.toString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Return CSV with proper headers
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="transactions-${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      },
    });
  } catch (error) {
    console.error("Error generating CSV export:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate CSV export" },
      { status: 500 }
    );
  }
}
