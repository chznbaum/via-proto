import { NextResponse } from "next/server";

// Health check endpoint for Coolify and monitoring
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "viaproto-web",
    },
    { status: 200 }
  );
}
