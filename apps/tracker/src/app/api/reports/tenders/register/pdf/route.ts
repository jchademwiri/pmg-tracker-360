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

  const clientId =
    new URL(request.url).searchParams.get("clientId") || undefined;
  const result = await getTenderRegisterPdf(
    session.session.activeOrganizationId,
    clientId,
  );
  if (!result.success)
    return NextResponse.json({ error: result.error }, { status: 500 });

  return new NextResponse(result.buffer as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
