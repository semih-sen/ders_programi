import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

// Use the same path as upload API
const saveDir = path.join(process.cwd(), 'private-data');
const savePath = path.join(saveDir, 'anatomi-gruplari.json');

export async function GET(request: Request) {
  // Security: API key check via Authorization: Bearer <N8N_INTERNAL_API_KEY>
  const authHeader = request.headers.get('Authorization');
  const expected = `Bearer ${process.env.N8N_INTERNAL_API_KEY}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const fileData = fs.readFileSync(savePath, 'utf8');
    const jsonData = JSON.parse(fileData);
    return NextResponse.json(jsonData);
  } catch (err: any) {
    if (err && (err.code === 'ENOENT' || err.message?.includes('no such file'))) {
      return NextResponse.json(
        { error: 'Anatomi JSON dosyası bulunamadı. Lütfen Admin panelinden yükleyin.' },
        { status: 404 }
      );
    }
    console.error('Read anatomi JSON error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
