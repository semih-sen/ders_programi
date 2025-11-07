import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: 'Admin - JSON Veri Editörü',
  description: 'JSON dosyalarını görüntüle ve düzenle',
};

export default async function DataFilesPage() {
  const session = await getServerSession(authOptions);

  // Güvenlik kontrolü
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  // private-data klasörünü tara
  const baseDir = path.join('/home/ghrunner/cinnasium-data', 'private-data');
  const jsonFiles: Array<{ relativePath: string; fullPath: string; slug: string }> = [];

  // Klasör varsa içeriğini oku
  if (fs.existsSync(baseDir)) {
    const donemFolders = fs.readdirSync(baseDir);
    
    for (const donemFolder of donemFolders) {
      const donemPath = path.join(baseDir, donemFolder);
      
      // Klasör mü kontrol et
      if (fs.statSync(donemPath).isDirectory()) {
        const files = fs.readdirSync(donemPath);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const relativePath = `${donemFolder}/${file}`;
            const fullPath = path.join(donemPath, file);
            const slug = `${donemFolder}/${file.replace('.json', '')}`;
            
            jsonFiles.push({ relativePath, fullPath, slug });
          }
        }
      }
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            📁 JSON Veri Editörü
          </h1>
          <p className="text-slate-400">
            Yüklediğiniz JSON dosyalarını görüntüleyin ve düzenleyin
          </p>
        </div>

        {/* Dosya Listesi */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          {jsonFiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📂</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Henüz dosya yüklenmemiş
              </h3>
              <p className="text-slate-400 mb-6">
                Düzenlenecek dosya bulunamadı. Önce dosya yükleyin.
              </p>
              <Link
                href="/admin/data-upload"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                </svg>
                Dosya Yükle
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white mb-4">
                Mevcut Dosyalar ({jsonFiles.length})
              </h2>
              
              {jsonFiles.map((file) => (
                <div
                  key={file.slug}
                  className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">{file.relativePath}</p>
                      <p className="text-slate-400 text-sm">{file.fullPath}</p>
                    </div>
                  </div>
                  
                  <Link
                    href={`/admin/data-files/edit/${file.slug}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Düzenle
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Geri Dön Linki */}
        <div className="mt-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Admin Paneline Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
