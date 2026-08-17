import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { generatePlatformMasterExcel } from "@/lib/reports-excel";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const buffer = await generatePlatformMasterExcel();
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `pmg-platform-master-report-${dateStr}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating platform master Excel report:", error);
    return new NextResponse("Failed to generate report", { status: 500 });
  }
}
