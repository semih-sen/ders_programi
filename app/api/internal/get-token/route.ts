import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

export async function POST(request: Request) {
  try {
    const auth = request.headers.get('authorization') || request.headers.get('Authorization');
    const expected = process.env.N8N_INTERNAL_API_KEY;
    if (!expected) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    if (!auth || !auth.startsWith('Bearer ') || auth.substring(7) !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null) as { userId?: string } | null;
    const userId = body?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const account = await prisma.account.findFirst({
      where: { userId },
      select: { refresh_token: true },
    });

    if (!account || !account.refresh_token) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const decryptedToken = decrypt(account.refresh_token);
    return NextResponse.json({ decryptedToken });
  } catch (err) {
    console.error('get-token error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
