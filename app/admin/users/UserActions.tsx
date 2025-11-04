'use client';

import { toggleUserBan, deleteUser, toggleUserRole } from './actions';
import { useTransition } from 'react';

export function BanButton({ userId, isBanned }: { userId: string; isBanned: boolean }) {
  const [isPending, startTransition] = useTransition();
  
  return (
    <button
      onClick={() => startTransition(async () => {
        await toggleUserBan(userId, isBanned);
      })}
      disabled={isPending}
      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
        isBanned
          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
      } disabled:opacity-50`}
    >
      {isBanned ? 'Yasağı Kaldır' : 'Yasakla'}
    </button>
  );
}

export function RoleButton({ userId, currentRole }: { userId: string; currentRole: 'ADMIN' | 'USER' }) {
  const [isPending, startTransition] = useTransition();
  
  return (
    <button
      onClick={() => startTransition(async () => {
        await toggleUserRole(userId, currentRole);
      })}
      disabled={isPending}
      className="px-3 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
    >
      {currentRole === 'ADMIN' ? 'USER Yap' : 'ADMIN Yap'}
    </button>
  );
}

export function DeleteButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  
  return (
    <button
      onClick={() => {
        if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
          startTransition(async () => {
            await deleteUser(userId);
          });
        }
      }}
      disabled={isPending}
      className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}