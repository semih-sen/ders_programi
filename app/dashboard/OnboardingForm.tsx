'use client';

import { useState, useTransition } from 'react';
import { saveOnboardingPreferences, type OnboardingData } from './actions';

type Course = {
  id: string;
  name: string;
};

type CoursePreference = {
  addToCalendar: boolean;
  notifications: boolean;
};

type OnboardingFormProps = {
  courses: Course[];
};

export default function OnboardingForm({ courses }: OnboardingFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [uygulamaGrubu, setUygulamaGrubu] = useState<string>('');
  const [anatomiGrubu, setAnatomiGrubu] = useState<string>('');
  const [yemekhaneEklensin, setYemekhaneEklensin] = useState<boolean>(false);
  const [classYear, setClassYear] = useState<string>('');
  const [language, setLanguage] = useState<string>('TR');

  // Initialize course preferences - all checked by default
  const [coursePreferences, setCoursePreferences] = useState<Record<string, CoursePreference>>(
    () => {
      const initial: Record<string, CoursePreference> = {};
      courses.forEach((course) => {
        initial[course.id] = {
          addToCalendar: true,
          notifications: true,
        };
      });
      return initial;
    }
  );

  const handleCoursePreferenceChange = (
    courseId: string,
    field: 'addToCalendar' | 'notifications',
    value: boolean
  ) => {
    setCoursePreferences((prev) => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const data: OnboardingData = {
      uygulamaGrubu: uygulamaGrubu || undefined,
      anatomiGrubu: anatomiGrubu || undefined,
      yemekhaneEklensin,
      classYear: classYear ? parseInt(classYear) : undefined,
      language: language as 'TR' | 'EN' | undefined,
      coursePreferences,
    };

    startTransition(async () => {
      const result = await saveOnboardingPreferences(data);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(result.message || 'Başarılı!');
        // Redirect after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    });
  };

  // Quick select all/none for courses
  const selectAllCourses = () => {
    const updated: Record<string, CoursePreference> = {};
    courses.forEach((course) => {
      updated[course.id] = { addToCalendar: true, notifications: true };
    });
    setCoursePreferences(updated);
  };

  const deselectAllCourses = () => {
    const updated: Record<string, CoursePreference> = {};
    courses.forEach((course) => {
      updated[course.id] = { addToCalendar: false, notifications: false };
    });
    setCoursePreferences(updated);
  };

  const selectedCoursesCount = Object.values(coursePreferences).filter(
    (pref) => pref.addToCalendar || pref.notifications
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold shadow-2xl mb-4">
            🎓
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Hoş Geldiniz!
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Kişiselleştirilmiş ders programınız için tercihlerinizi belirleyin
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-700/50 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Settings Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">Temel Ayarlar</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Uygulama Grubu */}
                <div>
                  <label htmlFor="uygulamaGrubu" className="block text-sm font-semibold text-white mb-3">
                    Uygulama Grubu <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="uygulamaGrubu"
                    value={uygulamaGrubu}
                    onChange={(e) => setUygulamaGrubu(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:bg-slate-700/70"
                  >
                    <option value="">Seçiniz...</option>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((group) => (
                      <option key={group} value={group}>Grup {group}</option>
                    ))}
                  </select>
                </div>

                {/* Anatomi Grubu */}
                <div>
                  <label htmlFor="anatomiGrubu" className="block text-sm font-semibold text-white mb-3">
                    Anatomi Grubu
                  </label>
                  <select
                    id="anatomiGrubu"
                    value={anatomiGrubu}
                    onChange={(e) => setAnatomiGrubu(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:bg-slate-700/70"
                  >
                    <option value="">Seçiniz...</option>
                    {['Anatomi-1', 'Anatomi-2', 'Anatomi-3'].map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                {/* Class Year */}
                <div>
                  <label htmlFor="classYear" className="block text-sm font-semibold text-white mb-3">
                    Dönem
                  </label>
                  <select
                    id="classYear"
                    value={classYear}
                    onChange={(e) => setClassYear(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:bg-slate-700/70"
                  >
                    <option value="">Seçiniz...</option>
                    {[1, 2, 3].map((year) => (
                      <option key={year} value={year}>Dönem {year}</option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label htmlFor="language" className="block text-sm font-semibold text-white mb-3">
                    Dil Tercihi
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:bg-slate-700/70"
                  >
                    <option value="TR">🇹🇷 Türkçe</option>
                    <option value="EN">🇬🇧 English</option>
                  </select>
                </div>
              </div>

              {/* Yemekhane Checkbox */}
              <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-slate-500 transition-all">
                <label htmlFor="yemekhane" className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    id="yemekhane"
                    checked={yemekhaneEklensin}
                    onChange={(e) => setYemekhaneEklensin(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div className="ml-3">
                    <span className="font-semibold text-white flex items-center gap-2">
                      🍽️ Yemekhane listesi takvimime eklensin
                    </span>
                    <p className="text-slate-400 text-sm mt-1">
                      Günlük yemekhane menüsü takvim etkinlikleri olarak eklenecektir.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Course Preferences */}
            <div className="pt-8 border-t border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Ders Tercihleri</h2>
                    <p className="text-slate-400 text-sm mt-1">
                      {selectedCoursesCount} / {courses.length} ders seçildi
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllCourses}
                    className="px-3 py-1.5 text-xs font-semibold bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-all"
                  >
                    Tümünü Seç
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllCourses}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all"
                  >
                    Tümünü Kaldır
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="group bg-slate-700/30 hover:bg-slate-700/50 rounded-lg p-4 border border-slate-600/50 hover:border-slate-500 transition-all"
                  >
                    <div className="flex flex-col gap-3">
                      <span className="text-white font-semibold text-sm">{course.name}</span>
                      
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={coursePreferences[course.id]?.addToCalendar ?? true}
                            onChange={(e) =>
                              handleCoursePreferenceChange(
                                course.id,
                                'addToCalendar',
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-xs text-slate-300">📅 Takvim</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={coursePreferences[course.id]?.notifications ?? true}
                            onChange={(e) =>
                              handleCoursePreferenceChange(
                                course.id,
                                'notifications',
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500 focus:ring-2"
                          />
                          <span className="text-xs text-slate-300">🔔 Bildirim</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border-2 border-green-500/50 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-400 text-sm font-medium">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydediliyor...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ✨ Kaydet ve Devam Et
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
