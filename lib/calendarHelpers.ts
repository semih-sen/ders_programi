import fs from 'fs';
import path from 'path';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string;
  color?: string;
  extendedProps?: {
    place?: string;
    lecturer?: string;
    type?: string;
  };
}

interface LessonData {
  gun?: string;
  baslangic?: string;
  bitis?: string;
  ders?: string;
  yer?: string;
  hoca?: string;
  grup?: string;
  [key: string]: any;
}

const COLORS: Record<string, string> = {
  Anatomi: '#3b82f6',
  Fizyoloji: '#8b5cf6',
  Histoloji: '#ec4899',
  Biyokimya: '#f59e0b',
  Yemekhane: '#10b981',
  default: '#6366f1',
};

/**
 * Ders verilerini JSON'dan okuyup FullCalendar formatına çevirir
 */
export async function getUserScheduleEvents(
  classYear: number,
  uygulamaGrubu?: string | null,
  anatomiGrubu?: string | null,
  yemekhaneEklensin?: boolean,
  subscribedCourses?: string[]
): Promise<CalendarEvent[]> {
  try {
    const dataDir = path.join('/home/ghrunner/sirkadiyen-data', 'private-data', `donem-${classYear}`);
    
    const events: CalendarEvent[] = [];
    let idCounter = 1;

    // Genel ders programı
    const teorikPath = path.join(dataDir, 'teorik.json');
    if (fs.existsSync(teorikPath)) {
      const teorikData: LessonData[] = JSON.parse(fs.readFileSync(teorikPath, 'utf-8'));
      teorikData.forEach((lesson) => {
        const courseName = lesson.ders || 'Bilinmeyen Ders';
        if (subscribedCourses && !subscribedCourses.some(c => courseName.includes(c))) return;
        
        events.push(transformLessonToEvent(lesson, idCounter++));
      });
    }

    // Uygulama grubu
    if (uygulamaGrubu) {
      const uygulamaPath = path.join(dataDir, 'uygulama.json');
      if (fs.existsSync(uygulamaPath)) {
        const uygulamaData: LessonData[] = JSON.parse(fs.readFileSync(uygulamaPath, 'utf-8'));
        uygulamaData
          .filter((lesson) => lesson.grup === uygulamaGrubu)
          .forEach((lesson) => {
            const courseName = lesson.ders || 'Bilinmeyen Ders';
            if (subscribedCourses && !subscribedCourses.some(c => courseName.includes(c))) return;
            
            events.push(transformLessonToEvent(lesson, idCounter++));
          });
      }
    }

    // Anatomi grubu
    if (anatomiGrubu) {
      const anatomiPath = path.join(process.cwd(), 'private-data', 'anatomi-gruplari.json');
      if (fs.existsSync(anatomiPath)) {
        const anatomiData: LessonData[] = JSON.parse(fs.readFileSync(anatomiPath, 'utf-8'));
        anatomiData
          .filter((lesson) => lesson.grup === anatomiGrubu)
          .forEach((lesson) => {
            events.push(transformLessonToEvent(lesson, idCounter++, 'Anatomi'));
          });
      }
    }

    // Yemekhane
    if (yemekhaneEklensin) {
      const yemekhPath = path.join(dataDir, 'yemek.json');
      if (fs.existsSync(yemekhPath)) {
        const yemekData: LessonData[] = JSON.parse(fs.readFileSync(yemekhPath, 'utf-8'));
        yemekData.forEach((lesson) => {
          events.push(transformLessonToEvent(lesson, idCounter++, 'Yemekhane'));
        });
      }
    }

    return events;
  } catch (error) {
    console.error('getUserScheduleEvents error:', error);
    return [];
  }
}

function transformLessonToEvent(lesson: LessonData, id: number, forceCourse?: string): CalendarEvent {
  const courseName = forceCourse || lesson.ders || 'Ders';
  const dayMap: Record<string, number> = {
    Pazartesi: 1,
    Salı: 2,
    Çarşamba: 3,
    Perşembe: 4,
    Cuma: 5,
    Cumartesi: 6,
    Pazar: 0,
  };

  const dayIndex = dayMap[lesson.gun || ''] ?? 1;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + dayIndex);
  
  const [startHour, startMin] = (lesson.baslangic || '09:00').split(':').map(Number);
  const [endHour, endMin] = (lesson.bitis || '10:00').split(':').map(Number);

  const start = new Date(startOfWeek);
  start.setHours(startHour, startMin, 0, 0);
  const end = new Date(startOfWeek);
  end.setHours(endHour, endMin, 0, 0);

  return {
    id: `event-${id}`,
    title: courseName,
    start: start.toISOString(),
    end: end.toISOString(),
    color: COLORS[courseName] || COLORS.default,
    extendedProps: {
      place: lesson.yer || '-',
      lecturer: lesson.hoca || '-',
      type: forceCourse || lesson.ders || 'Ders',
    },
  };
}
