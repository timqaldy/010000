import { NextResponse } from "next/server";
import { getEventRecords } from "@/lib/runtime";

export async function GET() {
  const feed = await getEventRecords();
  return NextResponse.json({ mode: feed.mode, events: feed.records.map((record) => record.event) });
}
