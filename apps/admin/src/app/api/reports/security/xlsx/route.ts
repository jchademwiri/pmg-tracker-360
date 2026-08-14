import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { generateSecurityAuditExcel } from '@/lib/reports-excel';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || (session.user as any).role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const buffer = await generateSecurityAuditExcel();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `pmg-security-audit-${dateStr}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating security Excel report:', error);
    return new NextResponse('Failed to generate report', { status: 500 });
  }
}
