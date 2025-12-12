import { prisma } from '@/lib/prisma';
import Client from './Client';

export const dynamic = 'force-dynamic';

async function getUsers(q?: string) {
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }
    : undefined;
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      isPaid: true,
      createdAt: true,
      updatedAt: true,
      accounts: { select: { provider: true, refresh_token: true } },
    },
  });
  return users.map((u: any) => ({
    ...u,
    hasCalendar: !!u.accounts?.find((a: any) => a.provider === 'google' && a.refresh_token),
  }));
}

function formatDate(d: Date) {
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function Page() {
  const users = await getUsers();
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-white">Toplu Etkinlik Gönderimi</h1>
      {/* Client wrapper */}
      <Client users={users} />
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: 'green' | 'gray' | 'red' }) {
  const map = {
    green: 'bg-green-600/20 text-green-300 border-green-600/30',
    gray: 'bg-slate-600/20 text-slate-300 border-slate-600/30',
    red: 'bg-red-600/20 text-red-300 border-red-600/30',
  } as const;
  return <span className={`text-xs border px-2 py-1 rounded ${map[color]}`}>{children}</span>;
}

// Client component moved to ./Client
