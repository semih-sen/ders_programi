"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Smartphone } from "lucide-react";

export default function MobileAppsCard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-900/30 p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <Smartphone className="w-6 h-6 text-emerald-400" />
        <h2 className="text-lg font-bold text-white">Takvimini Cebinde Taşı</h2>
      </div>

      <p className="text-slate-300 text-sm mb-6">
        Google Takvim uygulamasını cihazında yükle ve ders programını her zaman yanında taşı.
      </p>

      {/* App Store & Google Play Badges */}
      <div className="flex flex-col gap-4">
        {/* App Store Badge */}
        <Link
          href="https://apps.apple.com/app/google-calendar/id909319292"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity w-fit"
        >
          <Image
            src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/tr-tr?size=250x83"
            alt="App Store'dan İndirin"
            width={160}
            height={53}
            className="h-12 w-auto"
            priority
          />
        </Link>

        {/* Google Play Badge */}
        <Link
          href="https://play.google.com/store/apps/details?id=com.google.android.calendar"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity w-fit"
        >
          <Image
            src="https://play.google.com/intl/en_us/badges/static/images/badges/tr_badge_web_generic.png"
            alt="Google Play'DEN ALIN"
            width={160}
            height={53}
            className="h-12 w-auto"
            priority
          />
        </Link>
      </div>
    </div>
  );
}
