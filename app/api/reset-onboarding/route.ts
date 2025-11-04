import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Reset onboarding status and delete course subscriptions
    await prisma.$transaction(async (tx: any) => {
      // Delete all course subscriptions
      await tx.userCourseSubscription.deleteMany({
        where: { userId: session.user.id },
      });

      // Reset onboarding fields
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          hasCompletedOnboarding: false,
          uygulamaGrubu: null,
          anatomiGrubu: null,
          yemekhaneEklensin: false,
          classYear: null,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
