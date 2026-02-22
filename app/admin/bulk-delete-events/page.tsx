import { prisma } from '@/lib/prisma';
// @ts-ignore - Next.js app router resolves local client components at build time
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
      isBanned: true,
      createdAt: true,
      classYear: true,
    },
  });

  return users;
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
    return `/admin/bulk-delete-events${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-white">Toplu Etkinlik Silme</h1>
        <PeriodTabs activePeriod={gradeFilter} buildHref={buildUrl} />
        <p className="text-sm text-slate-400">
          Seçili döneme göre filtrelenmiş kullanıcılar. Sadece açıklamasında/başlığında "Sirkadiyen" imzası olan etkinlikler silinir.
        </p>
      </div>
      <Client users={users} />
    </div>
  );
}
