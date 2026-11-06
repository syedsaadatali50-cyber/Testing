import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const drive = await prisma.placementDrive.findUnique({
      where: { id: params.id },
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
        registrations: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!drive) {
      return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, drive });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch drive" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { name, driveDate, registrationDeadline, status, description, companyIds } = body;

    const updated = await prisma.placementDrive.update({
      where: { id: params.id },
      data: {
        name,
        driveDate: driveDate ? new Date(driveDate) : undefined,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
        status,
        description,
      },
    });

    // Update participating companies if provided
    if (Array.isArray(companyIds)) {
      // Remove previous links
      await prisma.driveCompany.deleteMany({
        where: { placementDriveId: params.id },
      });

      // Add new links
      for (const compId of companyIds) {
        await prisma.driveCompany.create({
          data: {
            placementDriveId: params.id,
            companyId: compId,
          },
        });
      }
    }

    return NextResponse.json({ success: true, drive: updated });
  } catch (error: any) {
    console.error("Update drive error:", error);
    return NextResponse.json({ error: "Failed to update placement drive" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await prisma.placementDrive.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Placement drive deleted successfully" });
  } catch (error: any) {
    console.error("Delete drive error:", error);
    return NextResponse.json({ error: "Failed to delete placement drive" }, { status: 500 });
  }
}
