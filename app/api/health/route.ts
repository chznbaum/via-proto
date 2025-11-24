import { NextResponse } from "next/server";

// Health check endpoint for Coolify and monitoring
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "viapro-web",
    },
    { status: 200 }
  );
}
