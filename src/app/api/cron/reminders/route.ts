import { NextRequest, NextResponse } from "next/server";
import { processReminders } from "@/lib/actions/reminder";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const boardingHouses = await prisma.boardingHouse.findMany({
      select: { id: true, name: true },
    });

    let totalSent = 0;
    let totalSkipped = 0;

    for (const house of boardingHouses) {
      const result = await processReminders(house.id);
      totalSent += result.sent;
      totalSkipped += result.skipped;
    }

    return NextResponse.json({
      success: true,
      processed: boardingHouses.length,
      totalSent,
      totalSkipped,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/reminders] Failed to process reminders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process reminders",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
