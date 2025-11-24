import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/internal/random-quote
 * Rastgele bir özlü sözü (quote) döndürür.
 * Güvenlik: Authorization: Bearer <N8N_INTERNAL_API_KEY> zorunlu.
 */
export async function GET(request: Request) {
  try {
    // API Key kontrolü
    const authHeader = request.headers.get('Authorization');
    const expected = `Bearer ${process.env.N8N_INTERNAL_API_KEY}`;
    if (!expected || !authHeader || authHeader !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const filePath = path.join(process.cwd(), 'quotas.json');

    // Dosyayı oku (senkron küçük dosya için yeterli)
    let raw: string;
    try {
      raw = fs.readFileSync(filePath, 'utf8');
    } catch (err: any) {
      if (err?.code === 'ENOENT') {
        return NextResponse.json({ error: 'quotes dosyası bulunamadı' }, { status: 404 });
      }
      throw err;
    }

    let quotes: any[];
    try {
      quotes = JSON.parse(raw);
      if (!Array.isArray(quotes) || quotes.length === 0) {
        return NextResponse.json({ error: 'Geçersiz veya boş quote verisi' }, { status: 422 });
      }
    } catch (err) {
      return NextResponse.json({ error: 'JSON parse hatası' }, { status: 500 });
    }

    const randomIndex = Math.floor(Math.random() * quotes.length);
    const selected = quotes[randomIndex];

    // Temiz response (gerekirse future ek alanlar eklenebilir)
    return NextResponse.json({
      id: selected.id,
      text: selected.text,
      category: selected.category,
      total: quotes.length,
      index: randomIndex,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('random-quote API hatası:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
