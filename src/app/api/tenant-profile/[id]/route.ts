import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getTenantProfile } from "@/lib/actions/tenant-profile";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json(null, { status: 401 });

  const { id } = await params;
  const profile = await getTenantProfile(id);
  if (!profile) return NextResponse.json(null, { status: 404 });

  // Verify ownership
  const house = await prisma.boardingHouse.findUnique({
    where: { id: profile.boardingHouse?.id || "" },
    select: { ownerId: true },
  });
  if (!house || house.ownerId !== user.id) {
    return NextResponse.json(null, { status: 403 });
  }

  return NextResponse.json(profile);
}
