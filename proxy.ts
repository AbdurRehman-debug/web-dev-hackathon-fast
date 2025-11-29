import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import connectDB from '@/app/mongoose/index';
import { UserModel } from '@/app/mongoose/models';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
  '/',
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding']);
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();

  // Allow public routes and API routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Redirect to sign-in if not authenticated
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // If user is authenticated, check profile completion for protected routes
  if (userId && (isDashboardRoute(req) || isOnboardingRoute(req))) {
    try {
      await connectDB();
      const user = await UserModel.findOne({ clerkId: userId });
      const isProfileCompleted = user?.isProfileCompleted || false;

      // If profile is NOT completed and trying to access dashboard
      if (!isProfileCompleted && isDashboardRoute(req)) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }

      // If profile IS completed and trying to access onboarding
      if (isProfileCompleted && isOnboardingRoute(req)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    } catch (error) {
      console.error('Profile check error:', error);
      // On error, allow the request to proceed
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
