import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getSystemStats } from '@/lib/system-monitor';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/admin/system-stats
 * Returns real-time system statistics (CPU, RAM, Swap, Disk, Uptime)
 * Requires ADMIN role
 */
export async function GET() {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get system statistics
    const stats = await getSystemStats();

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch system statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
