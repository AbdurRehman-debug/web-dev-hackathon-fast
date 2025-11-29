
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export function useProfileStatus() {
  const [isProfileCompleted, setIsProfileCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    const checkProfile = async () => {
      if (!isLoaded) return;
      
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/check-profile');
        const data = await response.json();
        setIsProfileCompleted(data.isProfileCompleted);
      } catch (error) {
        console.error('Failed to check profile:', error);
        setIsProfileCompleted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkProfile();
  }, [userId, isLoaded]);

  const redirectToOnboarding = () => {
    router.push('/onboarding');
  };

  const redirectToDashboard = () => {
    router.push('/dashboard');
  };

  return {
    isProfileCompleted,
    isLoading,
    redirectToOnboarding,
    redirectToDashboard,
  };
}
