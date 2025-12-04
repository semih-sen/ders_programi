"use client";

import React from "react";
import { BookOpen, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubscribedCoursesCardProps {
  courses: Array<{
    courseId: string;
    course: {
      name: string;
    };
    addToCalendar: boolean;
    notifications: boolean;
  }>;
  uygulamaGrubu?: string | null;
  anatomiGrubu?: string | null;
}

export default function SubscribedCoursesCard({ courses, uygulamaGrubu, anatomiGrubu }: SubscribedCoursesCardProps) {
  const router = useRouter();
  const calendarCourses = courses.filter((c) => c.addToCalendar);

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold text-lg">Takip Edilen Dersler</h3>
        </div>
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          title="Düzenle"
        >
          <Edit3 className="w-4 h-4 text-slate-400 hover:text-white" />
        </button>
      </div>

      {/* Grup Bilgileri */}
      {(uygulamaGrubu || anatomiGrubu) && (
        <div className="mb-3 space-y-1">
          {uygulamaGrubu && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Uygulama Grubu:</span>
              <span className="text-white font-medium">{uygulamaGrubu}</span>
            </div>
          )}
          {anatomiGrubu && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Anatomi Grubu:</span>
              <span className="text-white font-medium">{anatomiGrubu}</span>
            </div>
          )}
        </div>
      )}

      {/* Ders Listesi */}
      <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        {calendarCourses.length > 0 ? (
          calendarCourses.map((sub) => (
            <div
              key={sub.courseId}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-slate-200 text-sm font-medium">{sub.course.name}</span>
              </div>
              {sub.notifications && (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-500/10 text-green-300 border border-green-500/30">
                  Bildirim
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Henüz ders seçilmedi</p>
          </div>
        )}
      </div>

      {/* Düzenle Link */}
      <button
        onClick={() => router.push("/dashboard/settings")}
        className="w-full mt-4 text-center text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
      >
        Ders seçimlerini düzenle →
      </button>
    </div>
  );
}
