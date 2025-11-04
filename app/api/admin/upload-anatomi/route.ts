import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import fs from 'node:fs';
// Note: The `docx` package is primarily for document generation, not parsing.
// We still install it as requested, but for robust server-side parsing of tables
// from .docx we use `mammoth` (to HTML) and then parse the HTML table structure.
import type { Document as DocxDocument, Packer, Paragraph, Table } from 'docx';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';

// Persistent JSON output path (ensure permissions on your server)
const SAVE_PATH = '/var/data/cinnasium/anatomi-gruplari.json';

export async function POST(request: Request) {
  try {
    // 1) Security: Only ADMIN can upload
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2) Receive form-data and get the file
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 3) Parse .docx -> HTML -> Extract table rows to JSON
    //    We convert the Word document to HTML using mammoth, then walk tables.
    const { value: html } = await mammoth.convertToHtml({ buffer });
    const $ = cheerio.load(html);

    const jsonData: Array<{ diseksiyon: string; grup: string }> = [];

    $('table').each((_, tableEl) => {
      const rows = $(tableEl).find('tr');

      // Heuristic A: If rows have >= 2 cells, treat first two cells as [diseksiyon, grup]
      rows.each((__idx, tr) => {
        const cells = $(tr).find('td, th');
        if (cells.length >= 2) {
          const diseksiyonRaw = $(cells[0]).text().trim();
          const grupRaw = $(cells[1]).text().trim();
          const diseksiyon = normalizeLabel(diseksiyonRaw, ['Diseksiyon', 'Diseksiyon Adı']);
          const grup = normalizeLabel(grupRaw, ['Grup', 'Grup Adı']);
          if (diseksiyon && grup) {
            jsonData.push({ diseksiyon, grup });
          }
        }
      });

      // Heuristic B: If table appears as two single-row entries (row1=Diseksiyon, row2=Grup)
      // attempt to pair consecutive rows when each has one cell.
      if (jsonData.length === 0 && rows.length >= 2) {
        for (let i = 0; i < rows.length - 1; i += 2) {
          const r1Cells = $(rows[i]).find('td, th');
          const r2Cells = $(rows[i + 1]).find('td, th');
          if (r1Cells.length === 1 && r2Cells.length === 1) {
            const diseksiyonRaw = $(r1Cells[0]).text().trim();
            const grupRaw = $(r2Cells[0]).text().trim();
            const diseksiyon = normalizeLabel(diseksiyonRaw, ['Diseksiyon', 'Diseksiyon Adı']);
            const grup = normalizeLabel(grupRaw, ['Grup', 'Grup Adı']);
            if (diseksiyon && grup) {
              jsonData.push({ diseksiyon, grup });
            }
          }
        }
      }
    });

    // 4) Save JSON to disk
    // Ensure parent directory exists (no-op if already present)
    try {
      fs.mkdirSync(require('node:path').dirname(SAVE_PATH), { recursive: true });
    } catch {}

    fs.writeFileSync(SAVE_PATH, JSON.stringify(jsonData, null, 2), 'utf8');

    return NextResponse.json({ success: true, message: 'Anatomi grubu dosyası başarıyla güncellendi.' });
  } catch (err) {
    console.error('Upload anatomi parse/save error:', err);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu' }, { status: 500 });
  }
}

function normalizeLabel(value: string, possiblePrefixes: string[]): string {
  let v = value;
  for (const p of possiblePrefixes) {
    const withColon = `${p}:`;
    if (v.toLowerCase().startsWith(withColon.toLowerCase())) {
      v = v.slice(withColon.length).trim();
    } else if (v.toLowerCase().startsWith(p.toLowerCase())) {
      v = v.slice(p.length).trim();
    }
  }
  return v;
}
