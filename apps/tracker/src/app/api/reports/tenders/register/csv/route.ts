import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getTendersExportCsv } from "@/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!session.session?.activeOrganizationId) {
    return NextResponse.json(
      { error: "No organization selected." },
      { status: 400 },
    );
  }

  const { success: hasPermission } = await auth.api.hasPermission({
    headers: await headers(),
    body: {
      permissions: {
        tender: ["read"],
      },
    },
  });

  if (!hasPermission) {
    return NextResponse.json(
      { error: "Insufficient permissions." },
      { status: 403 },
    );
  }

  const result = await getTendersExportCsv(
    session.session.activeOrganizationId,
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return new NextResponse(result.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
