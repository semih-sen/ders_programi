import { prisma } from '@/lib/prisma';
import Client from './Client';
import { PeriodTabs } from '../components/PeriodTabs';

export const dynamic = 'force-dynamic';

async function getUsers(gradeFilter?: number) {
  const whereClauses: any[] = [];

  if (gradeFilter !== undefined) {
    whereClauses.push({ OR: [{ classYear: gradeFilter }, { classYear: null }] });
  }

  const where = whereClauses.length ? { AND: whereClauses } : undefined;

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      paymentStatus: true,
      isActivated: true,
      createdAt: true,
      classYear: true,
      accounts: { select: { provider: true, refresh_token: true } },
    },
  });

  return users.map((u: any) => ({
    ...u,
    hasCalendar: !!u.accounts?.find((a: any) => a.provider === 'google' && a.refresh_token),
  }));
}

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    grade?: string;
  };
}) {
  const gradeParam = searchParams?.grade?.trim();
  const parsedGrade = gradeParam ? parseInt(gradeParam, 10) : undefined;
  const gradeFilter = Number.isNaN(parsedGrade) ? undefined : parsedGrade;

  const users = await getUsers(gradeFilter);

  function buildUrl(period?: number) {
    const sp = new URLSearchParams();
    if (period !== undefined) sp.set('grade', String(period));
    const qs = sp.toString();
    return `/admin/bulk-events${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-white">Toplu Etkinlik Gönderimi</h1>
        <PeriodTabs activePeriod={gradeFilter} buildHref={buildUrl} />
        <p className="text-sm text-slate-400">
          Seçili sekmeye göre kullanıcı listesi filtrelenir. Dönemsiz kullanıcılar her sekmede görünür.
        </p>
      </div>
      <Client users={users} />
    </div>
  );
}
