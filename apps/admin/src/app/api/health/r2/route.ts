import { NextResponse } from "next/server";
import { checkR2Connection } from "@/lib/r2-health";

/**
 * R2 backup-storage health endpoint for platform monitoring.
 *
 * 200 when the configured bucket accepts authenticated requests, 503 otherwise
 * (including when R2 env vars are missing). Point an uptime monitor at it so
 * credential breakage is caught even if the startup alert is missed.
 */
export async function GET() {
  const result = await checkR2Connection();

  return NextResponse.json(result, {
    status: result.ok ? 200 : 503,
  });
}
