import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

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
    return NextResponse.json({ error: "Failed to fetch drives" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      driveDate,
      registrationDeadline,
      status = "Active",
      description,
      companyIds = [],
    } = body;

    if (!name || !driveDate || !registrationDeadline) {
      return NextResponse.json(
        { error: "Drive name, drive date, and registration deadline are required." },
        { status: 400 }
      );
    }

    // If activating this drive, optionally deactivate others if desired, or keep multiple
    const drive = await prisma.placementDrive.create({
      data: {
        name,
        driveDate: new Date(driveDate),
        registrationDeadline: new Date(registrationDeadline),
        status,
        description,
      },
    });

    // Link participating companies
    if (Array.isArray(companyIds) && companyIds.length > 0) {
      for (const compId of companyIds) {
        await prisma.driveCompany.create({
          data: {
            placementDriveId: drive.id,
            companyId: compId,
          },
        });
      }
    }

    return NextResponse.json({ success: true, drive }, { status: 201 });
  } catch (error: any) {
    console.error("Create drive error:", error);
    return NextResponse.json({ error: "Failed to create placement drive" }, { status: 500 });
  }
}
