"use client";

import React from "react";
import { BookOpen } from "lucide-react";

interface CoursesListCardProps {
  courses: Array<{
    courseId: string;
    course: {
      name: string;
    };
    addToCalendar: boolean;
    notifications: boolean;
  }>;
}

export default function CoursesListCard({ courses }: CoursesListCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-900/30 p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-5">
        <BookOpen className="w-6 h-6 text-emerald-400" />
        <h2 className="text-lg font-bold text-white">Seçili Dersler</h2>
      </div>

      {/* Ders Listesi - Scrollable */}
      <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50 space-y-2">
        {courses.length > 0 ? (
          courses.map((sub) => (
            <div
              key={sub.courseId}
              className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/60 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-slate-200 text-sm font-medium truncate">
                    {sub.course.name}
                  </span>
                </div>
                {sub.notifications && (
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/40 flex-shrink-0">
                    Bildirim
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Henüz ders seçilmedi</p>
          </div>
        )}
      </div>
    </div>
  );
}
