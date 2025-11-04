import { NextResponse } from 'next/server';
import fs from 'node:fs';

const PATH = '/var/data/cinnasium/anatomi-gruplari.json';

export async function GET(request: Request) {
  // Security: API key check via Authorization: Bearer <N8N_INTERNAL_API_KEY>
  const authHeader = request.headers.get('Authorization');
  const expected = `Bearer ${process.env.N8N_INTERNAL_API_KEY}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const fileData = fs.readFileSync(PATH, 'utf8');
    const jsonData = JSON.parse(fileData);
    return NextResponse.json(jsonData);
  } catch (err: any) {
    if (err && (err.code === 'ENOENT' || err.message?.includes('no such file'))) {
      return NextResponse.json(
        { error: 'Anatomi JSON dosyası henüz oluşturulmamış.' },
        { status: 404 }
      );
    }
    console.error('Read anatomi JSON error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
