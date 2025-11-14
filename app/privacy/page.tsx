import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export const metadata = {
  title: 'Gizlilik Politikası - Sirkadiyen',
  description: 'Sirkadiyen gizlilik politikası ve kişisel veri koruma uygulamaları.',
};

export default function PrivacyPage() {
  // Read the privacy policy markdown file
  const filePath = path.join(process.cwd(), 'privacy_policy.md');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors mb-6"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Ana Sayfaya Dön
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Gizlilik Politikası
          </h1>
          <p className="text-slate-400">
            Son güncellenme: 2 Kasım 2025
          </p>
        </div>

        {/* Markdown Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-white mb-4 mt-8 first:mt-0" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-white mb-3 mt-6" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-semibold text-white mb-2 mt-4" {...props} />,
                p: ({ node, ...props }) => <p className="text-slate-300 mb-4 leading-relaxed" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside text-slate-300 mb-4 space-y-2" {...props} />,
                li: ({ node, ...props }) => <li className="text-slate-300" {...props} />,
                a: ({ node, ...props }) => <a className="text-blue-400 hover:text-blue-300 underline" {...props} />,
                strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />,
                code: ({ node, ...props }) => <code className="bg-slate-900 text-blue-300 px-2 py-1 rounded text-sm" {...props} />,
              }}
            >
              {fileContent}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link
              href="/terms"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Hizmet Şartlarını Görüntüle →
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
