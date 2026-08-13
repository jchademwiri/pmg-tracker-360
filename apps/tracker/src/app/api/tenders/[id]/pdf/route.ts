import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { generateTenderPdf } from '@/lib/pdf/tender-pdf';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!session.session?.activeOrganizationId) {
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

  const { id } = await params;
  const result = await generateTenderPdf(session.session.activeOrganizationId, id);

  if (!result) {
    return NextResponse.json({ error: 'Tender not found.' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
