import Link from 'next/link';

const PERIODS = [1, 2, 3, 4, 5] as const;

type PeriodTabsProps = {
  activePeriod?: number;
  buildHref: (period?: number) => string;
  className?: string;
};

export function PeriodTabs({ activePeriod, buildHref, className }: PeriodTabsProps) {
  const tabs: { label: string; value?: number }[] = [
    { label: 'Tümü', value: undefined },
    ...PERIODS.map((p) => ({ label: `Dönem ${p}`, value: p })),
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      {tabs.map((tab) => {
        const active = tab.value === activePeriod || (tab.value === undefined && activePeriod === undefined);
        return (
          <Link
            key={tab.label}
            href={buildHref(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              active
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700/60'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
