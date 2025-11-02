import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-slate-400 text-sm text-center md:text-left">
            © 2025 Cinnasium Takvimdâr. Halil Semih Şen & Abdullah Ceylan.
          </div>

          {/* Legal Links */}
          <div className="flex space-x-6">
            <Link
              href="/privacy"
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              Gizlilik Politikası
            </Link>
            <Link
              href="/terms"
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              Hizmet Şartları
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-xs text-slate-500">
          İstanbul Tıp Fakültesi öğrencileri için geliştirilmiştir.
        </div>
      </div>
    </footer>
  );
}
