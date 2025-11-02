import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getRefreshToken } from '@/lib/get-refresh-token';

/**
 * Example API route that retrieves the user's refresh token
 * and could pass it to an n8n workflow
 * 
 * GET /api/n8n/trigger
 */
export async function GET() {
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the decrypted refresh token for this user
    const refreshToken = await getRefreshToken(session.user.id, 'google');

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 404 }
      );
    }

    // Example: Here you would make a request to your n8n webhook
    // passing the refresh token
    /*
    const n8nResponse = await fetch('https://your-n8n-instance.com/webhook/your-workflow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: session.user.id,
        userEmail: session.user.email,
        refreshToken: refreshToken,
        // Add any other data your n8n workflow needs
      }),
    });

    const result = await n8nResponse.json();
    */

    // For security, don't return the actual token in production
    // This is just for demonstration
    return NextResponse.json({
      success: true,
      userId: session.user.id,
      userEmail: session.user.email,
      hasRefreshToken: true,
      // In production, remove this line:
      refreshToken: process.env.NODE_ENV === 'development' ? refreshToken : undefined,
    });
  } catch (error) {
    console.error('Error in n8n trigger:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
