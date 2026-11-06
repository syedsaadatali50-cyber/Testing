import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const drives = await prisma.placementDrive.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        companies: {
          include: {
            company: {
              include: {
                jobRoles: true,
              },
            },
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, drives });
  } catch (error: any) {
    console.error("Fetch drives error:", error);
    return NextResponse.json(
      { error: "Failed to fetch placement drives" },
      { status: 500 }
    );
  }
}
