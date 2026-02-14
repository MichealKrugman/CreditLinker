import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import prisma from "@/lib/database/prisma";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.businessId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { businessName } = await request.json();

    if (!businessName) {
      return NextResponse.json(
        { success: false, error: "Business name is required" },
        { status: 400 }
      );
    }

    await prisma.business.update({
      where: { id: session.user.businessId },
      data: { name: businessName },
    });

    return NextResponse.json({
      success: true,
      message: "Business updated successfully",
    });
  } catch (error) {
    console.error("Business update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update business" },
      { status: 500 }
    );
  }
}
