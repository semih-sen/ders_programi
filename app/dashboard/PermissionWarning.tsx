'use client';

import { signIn } from 'next-auth/react';

interface PermissionWarningProps {
  hasCalendarPermission: boolean;
}

export default function PermissionWarning({ hasCalendarPermission }: PermissionWarningProps) {
  // Eğer izin varsa, hiçbir şey gösterme
  if (hasCalendarPermission) {
    return null;
  }

  // İzin yoksa uyarı kutusu göster
  return (
    <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-xl p-6 mb-8 backdrop-blur-sm">
      <div className="flex items-start gap-4">
        {/* Uyarı İkonu */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-red-500/30 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* İçerik */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-400 mb-2">
            ⚠️ DİKKAT: Takvim Erişim İzni Eksik
          </h3>
          <p className="text-white mb-4">
            Google Takvim erişim izni vermediğiniz için ders programınız eşitlenemiyor. 
            Bu özellikten faydalanmak için lütfen izinleri onaylayın.
          </p>

          {/* Düzeltme Butonu */}
          <button
            onClick={() => {
              // Force consent screen to request new permissions and get a fresh refresh_token
              // This is only triggered when user explicitly repairs permissions
              signIn('google', {
                callbackUrl: '/dashboard',
                prompt: 'consent', // Force consent screen to get new refresh_token
              });
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            İzinleri Onar / Tekrar Giriş Yap
          </button>

          {/* Yardım Metni */}
          <p className="text-slate-400 text-sm mt-3">
            <strong>Not:</strong> Giriş ekranında tüm izinleri onayladığınızdan emin olun.
          </p>
        </div>
      </div>
    </div>
  );
}
