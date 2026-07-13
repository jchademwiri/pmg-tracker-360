import { NextResponse } from 'next/server';
import { runAutomatedBackup } from '@/lib/backup';

/**
 * Vercel Cron Job endpoint for automatic daily backups.
 * 
 * To enable, add to vercel.json in the project root:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/backup",
 *       "schedule": "0 0 * * *"
 *     }
 *   ]
 * }
 * 
 * Requires CRON_SECRET environment variable to be set.
 * Send as: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    return NextResponse.json(
      { success: false, message: 'CRON_SECRET not configured on server' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await runAutomatedBackup();
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: (err as Error).message },
      { status: 500 }
    );
  }
}
