import { Suspense } from 'react';
import BannedMessage from './BannedMessage';

export default function BannedPage() {
  return (
    <Suspense fallback={<BannedPageFallback />}>
      <BannedMessage />
    </Suspense>
  );
}

// Loading fallback component
function BannedPageFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white text-4xl font-bold shadow-lg mb-6 animate-pulse">
            🚫
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Yükleniyor...
          </h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    </main>
  );
}
