import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { generateTenderWinLossPdf } from '@/lib/pdf/tender-winloss-pdf';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session?.activeOrganizationId) {
    return NextResponse.json({ error: 'No organization selected.' }, { status: 400 });
  }

  const { success: hasPermission } = await auth.api.hasPermission({
    headers: await headers(),
    body: {
      permissions: {
        tender: ['read'],
      },
    },
  });

  if (!hasPermission) {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
  }

  const result = await generateTenderWinLossPdf(session.session.activeOrganizationId);

  if (!result) {
    return NextResponse.json({ error: 'Failed to generate report.' }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
