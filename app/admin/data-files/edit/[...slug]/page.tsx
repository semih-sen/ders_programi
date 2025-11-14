import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import JsonEditorTable from './JsonEditorTable';

interface PageProps {
  params: {
    slug: string[];
  };
}

export default async function EditDataFilePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  // Güvenlik kontrolü
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  // Slug'dan dosya yolunu oluştur
  const fileSlug = params.slug.join('/');
  const filePath = path.join('/home/ghrunner/sirkadiyen-data', 'private-data', `${fileSlug}.json`);

  // Dosya var mı kontrol et
  if (!fs.existsSync(filePath)) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Dosya Bulunamadı</h2>
            <p className="text-slate-400 mb-6">
              {fileSlug}.json dosyası mevcut değil.
            </p>
            <Link
              href="/admin/data-files"
              className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dosya Listesine Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Dosyayı oku ve parse et
  let data: any[];
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(fileContent);

    if (!Array.isArray(data)) {
      throw new Error('Dosya bir dizi içermiyor');
    }
  } catch (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Dosya Okunamadı</h2>
            <p className="text-slate-400 mb-6">
              JSON dosyası geçersiz veya okunamıyor.
            </p>
            <Link
              href="/admin/data-files"
              className="inline-flex items-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dosya Listesine Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Başlık */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-white">
              📝 {fileSlug}.json
            </h1>
            <Link
              href="/admin/data-files"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Geri
            </Link>
          </div>
          <p className="text-slate-400">
            Toplam {data.length} kayıt
          </p>
        </div>

        {/* Tablo */}
        <JsonEditorTable data={data} filePath={fileSlug} />
      </div>
    </div>
  );
}
