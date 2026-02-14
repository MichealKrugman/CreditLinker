import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/database/prisma";

/**
 * POST /api/auth/signup
 * Create a new user account with business
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, businessName, industry } = body;

    // Validate input
    if (!email || !password || !businessName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and business in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user first
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: businessName, // Using business name as user name for now
        },
      });

      // Then create business with userId
      const business = await tx.business.create({
        data: {
          name: businessName,
          type: industry || "PHARMACY",
          userId: user.id,
        },
      });

      return { user, business };
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      userId: result.user.id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}
