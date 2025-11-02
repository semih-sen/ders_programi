"use client";

import { useFormState, useFormStatus } from "react-dom";
import { activateAccount, ActivationState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      Aktifleştir
    </button>
  );
}

export default function ActivationForm() {
  const initialState: ActivationState = {};
  const [state, action] = useFormState(activateAccount, initialState);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 shadow-2xl">
      {state?.error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
          {state.error}
        </div>
      )}
      {state?.success && state?.message && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 text-green-300 px-4 py-3 text-sm">
          {state.message}
        </div>
      )}

      <form action={action} className="space-y-6">
        <div>
          <label htmlFor="licenseKey" className="block text-sm font-semibold text-slate-300 mb-2">
            Aktivasyon Kodu
          </label>
          <input
            type="text"
            id="licenseKey"
            name="licenseKey"
            placeholder="TAK-XXXXXXXX"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono uppercase"
            required
            pattern="TAK-[A-Z0-9]+"
            maxLength={20}
          />
          <p className="mt-2 text-xs text-slate-500">Aktivasyon kodunuzu yöneticinizden alabilirsiniz</p>
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
