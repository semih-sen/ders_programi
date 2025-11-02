'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function SignIn() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold shadow-lg mb-4">
            CT
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Cinnasium Takvimdâr
          </h1>
          <p className="text-slate-400">
            Ders programınızı takvime aktarmak için giriş yapın
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            Hesabınıza Giriş Yapın
          </h2>

          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path fill="#EA4335" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            Google ile Giriş Yap
          </button>

          {/* Info Text */}
          <p className="mt-6 text-sm text-slate-400 text-center">
            Giriş yaparak{' '}
            <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">
              Hizmet Şartlarımızı
            </Link>
            {' '}ve{' '}
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
              Gizlilik Politikamızı
            </Link>
            {' '}kabul etmiş olursunuz.
          </p>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Ana Sayfaya Dön
          </Link>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-blue-400 text-2xl mb-1">⚡</div>
            <p className="text-xs text-slate-400">Hızlı</p>
          </div>
          <div>
            <div className="text-purple-400 text-2xl mb-1">🔒</div>
            <p className="text-xs text-slate-400">Güvenli</p>
          </div>
          <div>
            <div className="text-green-400 text-2xl mb-1">🔄</div>
            <p className="text-xs text-slate-400">Otomatik</p>
          </div>
        </div>
      </div>
    </main>
  );
}
