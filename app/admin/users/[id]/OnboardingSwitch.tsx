'use client';

import { useState, useTransition } from 'react';
import { toggleOnboardingStatus } from '../actions';

interface OnboardingSwitchProps {
  userId: string;
  initialStatus: boolean;
}

export default function OnboardingSwitch({ userId, initialStatus }: OnboardingSwitchProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      const result = await toggleOnboardingStatus(userId, status);
      
      if (result.error) {
        setError(result.error);
      } else if (result.newStatus !== undefined) {
        setStatus(result.newStatus);
      }
    });
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>

          <h3 className="text-base font-semibold text-white mb-1">Kurulum Durumu</h3>
          <p className="text-xs text-slate-400">
            
            Kullanıcının ilk kurulum adımlarını tamamlama durumu
          </p>
        </div>
        
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={`
            relative inline-flex h-8 w-14 items-center rounded-full transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900
            ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${status ? 'bg-green-500' : 'bg-slate-600'}
          `}
          aria-label="Toggle onboarding status"
        >
          <span
            className={`
              inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform
              ${status ? 'translate-x-7' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-400' : 'bg-slate-500'}`} />
        <span className={`text-sm font-medium ${status ? 'text-green-400' : 'text-slate-400'}`}>
          {status ? 'Tamamlandı' : 'Tamamlanmadı'}
        </span>
        {isPending && (
          <div className="ml-2 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Güncelleniyor...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
