import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';

/**
 * API Bridge Endpoint for n8n
 * 
 * Securely fetches a user's complete profile including:
 * - Personal preferences (class year, language, groups)
 * - Course subscriptions with notification/calendar settings
 * - Decrypted Google Calendar refresh token
 * 
 * Security: Requires N8N_INTERNAL_API_KEY in Authorization header
 */
export async function POST(request: Request) {
  try {
    // 1. Security Check - Verify API Key
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.N8N_INTERNAL_API_KEY}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse Request Body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Bad Request: userId is required' },
        { status: 400 }
      );
    }

    // 3. Complex Database Query - Fetch User with All Relations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        
        email: true,
        name: true,
        image: true,
        hasCompletedOnboarding: true,
        classYear: true,
        language: true,
        uygulamaGrubu: true,
        anatomiGrubu: true,
        secmeliDers: true,
        yemekhaneEklensin: true,
        studentId: true,
        notificationOffset: true,
        firstLessonOffset: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: { refresh_token: true }
        },
        courseSubscriptions: {
          include: {
            course: {
              select: { name: true }
            }
          }
        }
      }
    });

    // 4. Error Handling - User Not Found
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.accounts[0]?.refresh_token) {
      return NextResponse.json(
        { error: 'No Google account linked for this user' },
        { status: 404 }
      );
    }

    // 5. Decrypt the Refresh Token
    let decryptedToken: string;
    try {
      const encryptedToken = user.accounts[0].refresh_token;
      decryptedToken = decrypt(encryptedToken);
    } catch (decryptError) {
      console.error('Token decryption failed:', decryptError);
      return NextResponse.json(
        { error: 'Internal Server Error: Token decryption failed' },
        { status: 500 }
      );
    }

    // 6. Data Transformation - Format Course Subscriptions
    const formattedCourseSubscriptions = user.courseSubscriptions.map((sub: any) => ({
      courseName: sub.course.name,
      notifications: sub.notifications,
      addToCalendar: sub.addToCalendar,
     
    }));

    // 7. Build Final Response Object for n8n
    const responseData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      
      // Onboarding Status
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      
      // User Preferences
      preferences: {
        classYear: user.classYear,
        language: user.language,
        uygulamaGrubu: user.uygulamaGrubu,
        anatomiGrubu: user.anatomiGrubu,
        secmeliDers: user.secmeliDers,
        yemekhaneEklensin: user.yemekhaneEklensin,
        studentId: user.studentId,
        notificationOffset: user.notificationOffset,
        firstLessonOffset: user.firstLessonOffset
      },
      
      // Course Subscriptions
      courseSubscriptions: formattedCourseSubscriptions,
      
      // Decrypted Token for Google Calendar API
      googleRefreshToken: decryptedToken,
      
      // Metadata
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };

    // 8. Return Success Response
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    // Catch-all error handler
    console.error('Unexpected error in get-user-profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
