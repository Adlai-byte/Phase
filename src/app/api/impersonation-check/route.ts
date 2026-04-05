import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const impersonating = !!cookieStore.get("phase-impersonate")?.value;
  return NextResponse.json({ impersonating });
}
