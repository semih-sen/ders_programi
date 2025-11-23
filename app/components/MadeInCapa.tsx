interface MadeInCapaProps {
  className?: string;
}

export default function MadeInCapa({ className }: MadeInCapaProps) {
  return (
    <div
      aria-label="Made in ÇAPA"
      title="Made in ÇAPA"
      className={`fixed bottom-4 right-4 z-[1200] select-none ${
        className ?? ''
      }`}
    >
      <div className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/70 backdrop-blur-md shadow-lg shadow-black/20 hover:shadow-black/30 transition-shadow">
        <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-200">
          <span role="img" aria-hidden>❤️</span>
          <span>Made in ÇAPA</span>
        </span>
      </div>
    </div>
  );
}
