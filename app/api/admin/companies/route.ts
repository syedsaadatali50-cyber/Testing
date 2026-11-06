import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        jobRoles: true,
        drives: {
          include: {
            placementDrive: true,
          },
        },
        _count: {
          select: {
            jobRoles: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, companies });
  } catch (error: any) {
    console.error("Fetch companies error:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { name, logo, description, status = "Active", website, active = true, placementDriveId } = body;

    if (!name || !description) {
      return NextResponse.json({ error: "Company name and description are required." }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name,
        logo: logo || "https://images.unsplash.com/photo-1542744094-24638eff58bb?w=128&h=128&fit=crop",
        description,
        status,
        active: status === "Active" ? active : false,
        website,
      },
    });

    // If a placement drive is selected, link it immediately
    if (placementDriveId) {
      await prisma.driveCompany.create({
        data: {
          companyId: company.id,
          placementDriveId,
        },
      });
    }

    return NextResponse.json({ success: true, company }, { status: 201 });
  } catch (error: any) {
    console.error("Create company error:", error);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}
