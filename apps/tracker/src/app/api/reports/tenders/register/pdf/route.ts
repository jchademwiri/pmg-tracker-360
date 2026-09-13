import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getTenderRegisterPdf } from "@/server/tender-register-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!session.session?.activeOrganizationId)
    return NextResponse.json(
      { error: "No organization selected." },
      { status: 400 },
    );

  const { success: hasPermission } = await auth.api.hasPermission({
    headers: await headers(),
    body: { permissions: { tender: ["read"] } },
  });
  if (!hasPermission)
    return NextResponse.json(
      { error: "Insufficient permissions." },
      { status: 403 },
    );

  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId") || undefined;
  const preset = (url.searchParams.get("preset") as any) || "all";
  const customStart = url.searchParams.get("startDate");
  const customEnd = url.searchParams.get("endDate");

  const { calculateDateRange } = await import("@/lib/date-range-presets");
  const range = calculateDateRange(preset, customStart, customEnd);

  try {
    const result = await getTenderRegisterPdf(
      session.session.activeOrganizationId,
      {
        clientId,
        preset: range.preset,
        startDate: range.startDate,
        endDate: range.endDate,
        periodLabel: range.periodLabel,
      },
    );
    if (!result.success)
      return NextResponse.json({ error: result.error || "Failed to generate PDF." }, { status: 500 });

    return new NextResponse(result.buffer as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Tender register PDF export failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred generating PDF report.",
      },
      { status: 500 },
    );
  }
}
