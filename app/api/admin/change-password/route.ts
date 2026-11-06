import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession, hashPassword, comparePassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: session.id },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
    }

    if (currentPassword) {
      const match = await comparePassword(currentPassword, admin.passwordHash);
      if (!match) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 }
        );
      }
    }

    const newHash = await hashPassword(newPassword.trim());
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({
      success: true,
      message: "Admin password updated successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update password." },
      { status: 500 }
    );
  }
}
