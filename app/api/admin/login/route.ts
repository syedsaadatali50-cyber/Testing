import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, signAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: "Please enter your admin password." },
        { status: 400 }
      );
    }

    let admin;
    if (email && email.trim().length > 0) {
      admin = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
    } else {
      // Find primary admin account
      admin = await prisma.adminUser.findFirst({
        where: { role: "admin" },
      }) || await prisma.adminUser.findFirst();
    }

    if (!admin) {
      return NextResponse.json(
        { error: "Admin account not found in database." },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect admin password. Please try again." },
        { status: 401 }
      );
    }

    const token = signAdminToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful",
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { error: "Internal server error during login." },
      { status: 500 }
    );
  }
}
