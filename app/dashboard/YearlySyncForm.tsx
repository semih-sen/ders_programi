"use client";

import { useFormState, useFormStatus } from "react-dom";
import { triggerYearlySync, type YearlySyncState } from "./actions";

function Submit({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Senkronize ediliyor…' : 'Yıllık Senkronizasyon Yap'}
    </button>
  );
}

export default function YearlySyncForm({ hasYearlySynced }: { hasYearlySynced: boolean }) {
  const initialState: YearlySyncState = {};
  const [state, action] = useFormState(triggerYearlySync, initialState);

  return (
    <div>
      <form action={action}>
        <Submit disabled={hasYearlySynced} />
      </form>
      {hasYearlySynced && (
        <p className="text-yellow-400 text-sm mt-2">
          ✓ Yıllık senkronizasyon daha önce yapılmış.
        </p>
      )}
      {state?.message && (
        <p className={`text-sm mt-2 ${state.success ? 'text-green-300' : 'text-red-300'}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}
