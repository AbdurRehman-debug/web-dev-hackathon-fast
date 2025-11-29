import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/app/mongoose/index';
import {Profile,UserModel} from "@/app/mongoose/models"

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return NextResponse.json({ 
        error: 'Profile not found',
        isProfileCompleted: false 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile._id,
        resumePath: profile.resumePath,
        skills: profile.skills,
        experience: profile.experience,
        education: profile.education,
        projects: profile.projects,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// ==============