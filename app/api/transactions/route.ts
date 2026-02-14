import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import prisma from "@/lib/database/prisma";

/**
 * GET /api/transactions
 * Fetch transactions with optional filtering and pagination
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
    const limit = parseInt(searchParams.get("limit") || "1000");
    const offset = parseInt(searchParams.get("offset") || "0");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

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

    // Fetch transactions
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
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        limit,
        offset,
        total: await prisma.transaction.count({ where }),
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
