import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

/**
 * Log user activity to the database
 * This is a fire-and-forget style logging that doesn't block the main thread
 * 
 * @param userId - User ID (null for guest users)
 * @param action - Action type (e.g., "LOGIN", "PAGE_VIEW", "BUTTON_CLICK")
 * @param details - Additional details (e.g., page path, button name)
 */
export async function logActivity(
  userId: string | null,
  action: string,
  details?: string | null
): Promise<void> {
  try {
    // Extract headers
    const headersList = headers();
    
    // Get IP address from various possible headers
    const forwarded = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const cfConnectingIp = headersList.get('cf-connecting-ip'); // Cloudflare
    
    // Priority: Cloudflare > X-Real-IP > X-Forwarded-For > fallback
    let ipAddress = cfConnectingIp || realIp || forwarded?.split(',')[0].trim() || null;
    
    // Get user agent
    const userAgent = headersList.get('user-agent') || null;
    
    // Fire-and-forget: Don't await this to avoid blocking
    prisma.activityLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress,
        userAgent,
      },
    }).catch((error: unknown) => {
      // Log error but don't throw to avoid disrupting the main flow
      console.error('❌ Failed to log activity:', error);
    });
    
  } catch (error) {
    // Silently fail to not disrupt the main application flow
    console.error('❌ Error in logActivity:', error);
  }
}

/**
 * Helper function to parse device type from user agent
 * Returns 'mobile', 'tablet', or 'desktop'
 */
export function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

/**
 * Helper function to parse browser from user agent
 */
export function getBrowser(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome/')) return 'Chrome';
  if (ua.includes('firefox/')) return 'Firefox';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
  if (ua.includes('opera/') || ua.includes('opr/')) return 'Opera';
  
  return 'other';
}
