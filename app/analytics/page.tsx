// app/analytics/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import connectDB from '@/app/mongoose/index';
import { Profile } from '@/app/mongoose/models';
import AnalyticsDashboard from '@/app/components/AnalyticsDashboard';

export default async function AnalyticsPage() {
  // Get authenticated user
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Connect to MongoDB
  await connectDB();
  
  // Fetch profile data using Mongoose
  const profile = await Profile.findOne({ userId }).lean();
  
  // Handle case where no profile exists
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 font-semibold mb-2">No profile data found</p>
          <p className="text-gray-600">Please upload your resume first</p>
          <a 
            href="/dashboard" 
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Convert MongoDB document to plain object (removes MongoDB-specific properties)
  // This is necessary because Next.js can't serialize MongoDB documents directly
  const profileData = JSON.parse(JSON.stringify(profile));

  return <AnalyticsDashboard profileData={profileData} />;
}