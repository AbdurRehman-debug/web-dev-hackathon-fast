
'use client';

import { useEffect } from 'react';
import { useProfileStatus } from '@/app/hooks/useProfileStatus';
import { useUser } from '@clerk/nextjs';

export default function DashboardPage() {
  const { isProfileCompleted, isLoading, redirectToOnboarding } = useProfileStatus();
  const { user } = useUser();

  useEffect(() => {
    if (!isLoading && isProfileCompleted === false) {
      redirectToOnboarding();
    }
  }, [isProfileCompleted, isLoading, redirectToOnboarding]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isProfileCompleted) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's your personalized dashboard
          </p>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Stats</h3>
            <p className="text-gray-600">Your profile is complete!</p>
          </div>
          
          {/* Add more dashboard widgets here */}
        </div>
      </div>
    </div>
  );
}