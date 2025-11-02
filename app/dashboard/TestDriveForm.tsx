"use client";

import { useFormState, useFormStatus } from "react-dom";
import { triggerTestWebhook, type WebhookState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-60"
    >
      {pending ? 'Gönderiliyor…' : 'N8N Test Sürüşü'}
    </button>
  );
}

export default function TestDriveForm() {
  const initialState: WebhookState = {};
  const [state, action] = useFormState(triggerTestWebhook, initialState);

  return (
    <form action={action} className="space-y-3">
      <Submit />
      {state?.message && (
        <p className={state.success ? 'text-green-300' : 'text-red-300'}>{state.message}</p>
      )}
    </form>
  );
}
