
// 2. API ROUTE - Check Profile Status
// ============================================
// app/api/check-profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/app/mongoose/index';
import { UserModel } from '@/app/mongoose/models';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ 
        isProfileCompleted: false 
      }, { status: 401 });
    }

    await connectDB();

    // Check if user exists and profile is completed
    const user = await UserModel.findOne({ clerkId: userId });

    return NextResponse.json({
      isProfileCompleted: user?.isProfileCompleted || false,
      userId: userId
    });

  } catch (error) {
    console.error('Profile check error:', error);
    return NextResponse.json(
      { isProfileCompleted: false },
      { status: 500 }
    );
  }
}