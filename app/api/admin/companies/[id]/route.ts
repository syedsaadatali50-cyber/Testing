import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        jobRoles: true,
        drives: {
          include: {
            placementDrive: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch company details" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { name, logo, description, status, website, active } = body;

    const updated = await prisma.company.update({
      where: { id: params.id },
      data: {
        name,
        logo,
        description,
        status,
        active: status === "Active" ? (active !== undefined ? active : true) : false,
        website,
      },
    });

    return NextResponse.json({ success: true, company: updated });
  } catch (error: any) {
    console.error("Update company error:", error);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await prisma.company.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Company deleted successfully" });
  } catch (error: any) {
    console.error("Delete company error:", error);
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }
}
