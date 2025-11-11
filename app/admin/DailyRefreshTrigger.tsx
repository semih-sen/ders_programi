'use client';

import { useFormState } from 'react-dom';
import { useFormStatus } from 'react-dom';
import { triggerDailyRefresh } from './actions';

const initialState: {
  success?: string;
  error?: string;
} = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          İşlem Yapılıyor...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          TÜM KULLANICILARI ŞİMDİ EŞİTLE
        </>
      )}
    </button>
  );
}

export default function DailyRefreshTrigger() {
  const [state, formAction] = useFormState(triggerDailyRefresh, initialState);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-red-500/30">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
          ⚡
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-1">Acil Durum: Manuel Eşitleme</h2>
          <p className="text-sm text-slate-400">Günlük tazeleme iş akışını manuel olarak tetikle</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-amber-200 font-semibold text-sm mb-1">⚠️ Dikkat!</p>
            <p className="text-amber-200/90 text-sm">
              Bu işlem, <strong>tüm aktif kullanıcıların</strong> takvimlerini (1 haftalık) silip yeniden yazar. 
              Sunucuya ağır yük bindirebilir. Bu işlemi yalnızca gerekli durumlarda kullanın.
            </p>
          </div>
        </div>
      </div>

      <form action={formAction}>
        <SubmitButton />
        
        {state?.success && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {state.success}
            </p>
          </div>
        )}
        
        {state?.error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {state.error}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
