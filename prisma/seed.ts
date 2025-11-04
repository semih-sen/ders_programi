import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // List of theoretical courses to seed
  const courses = [
    'Anatomi',
    'Fizyoloji',
    'Histoloji',
    'Biyokimya',
    "Biyofizik",
    'Mikrobiyoloji',
    'Patoloji',
    'Farmakoloji',
    'Dahiliye',
    'Cerrahi',
    'Pediatri',
    'Kadın Hastalıkları ve Doğum',
    'Psikiyatri',
    'Nöroloji',
    'Kardiyoloji',
    'Tıbbi Biyoloji',
    'Tıbbi Genetik',
    'Halk Sağlığı',
    'Tıp Tarihi ve Etik',
  ];

  console.log(`📚 Seeding ${courses.length} courses...`);

  for (const courseName of courses) {
    await prisma.course.upsert({
      where: { name: courseName },
      update: {},
      create: { name: courseName },
    });
    console.log(`  ✓ ${courseName}`);
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
