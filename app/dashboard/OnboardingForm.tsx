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
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-slate-700">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              🎓 Hoş Geldiniz!
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">
              Lütfen tercihlerinizi belirterek devam edin. Bu bilgiler kişiselleştirilmiş bir deneyim sunmamıza yardımcı olacak.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Uygulama Grubu */}
            <div>
              <label htmlFor="uygulamaGrubu" className="block text-sm font-semibold text-white mb-2">
                Uygulama Grubu
              </label>
              <select
                id="uygulamaGrubu"
                value={uygulamaGrubu}
                onChange={(e) => setUygulamaGrubu(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Seçiniz...</option>
                <option value="A">Grup A</option>
                <option value="B">Grup B</option>
                <option value="C">Grup C</option>
                <option value="D">Grup D</option>
              </select>
            </div>

            {/* Anatomi Grubu */}
            <div>
              <label htmlFor="anatomiGrubu" className="block text-sm font-semibold text-white mb-2">
                Anatomi Grubu
              </label>
              <select
                id="anatomiGrubu"
                value={anatomiGrubu}
                onChange={(e) => setAnatomiGrubu(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Seçiniz...</option>
                <option value="Anatomi-1">Anatomi-1</option>
                <option value="Anatomi-2">Anatomi-2</option>
                <option value="Anatomi-3">Anatomi-3</option>
                <option value="Anatomi-4">Anatomi-4</option>
              </select>
            </div>

            {/* Yemekhane Checkbox */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="yemekhane"
                checked={yemekhaneEklensin}
                onChange={(e) => setYemekhaneEklensin(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="yemekhane" className="ml-3 text-white">
                <span className="font-semibold">Yemekhane listesi takvimime eklensin</span>
                <p className="text-slate-400 text-sm mt-1">
                  Günlük yemekhane menüsü takvim etkinlikleri olarak eklenecektir.
                </p>
              </label>
            </div>

            {/* Class Year (Optional) */}
            <div>
              <label htmlFor="classYear" className="block text-sm font-semibold text-white mb-2">
                Dönem (Opsiyonel)
              </label>
              <select
                id="classYear"
                value={classYear}
                onChange={(e) => setClassYear(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Seçiniz...</option>
                <option value="1">Dönem 1</option>
                <option value="2">Dönem 2</option>
                <option value="3">Dönem 3</option>
                <option value="4">Dönem 4</option>
                <option value="5">Dönem 5</option>
                <option value="6">Dönem 6</option>
              </select>
            </div>

            {/* Language (Optional) */}
            <div>
              <label htmlFor="language" className="block text-sm font-semibold text-white mb-2">
                Dil Tercihi (Opsiyonel)
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="TR">Türkçe</option>
                <option value="EN">English</option>
              </select>
            </div>

            {/* Course Preferences */}
            <div className="pt-6 border-t border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">Teorik Ders Tercihleri</h2>
              <p className="text-slate-400 text-sm mb-4">
                Hangi derslerin takviminize eklenmesini ve bildirim almanızı istediğinizi seçin.
              </p>

              <div className="space-y-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-slate-700/30 rounded-lg p-4 border border-slate-600"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <span className="text-white font-semibold">{course.name}</span>
                      
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
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
                          <span className="text-sm text-slate-300">Takvime Ekle</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
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
                          <span className="text-sm text-slate-300">Bildirim Gönder</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isPending ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
