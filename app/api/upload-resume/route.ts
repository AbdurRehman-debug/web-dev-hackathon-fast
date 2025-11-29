import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import connectDB from '@/app/mongoose/index';
import {Profile,UserModel} from "@/app/mongoose/models"
import { UserProfile } from '@clerk/nextjs';
import { parseResumeText } from '@/lib/resume-parser';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('resume') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file to server
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileName = `${userId}_${Date.now()}_${file.name}`;
    const filePath = path.join(uploadsDir, fileName);
    
    await writeFile(filePath, buffer);

    // Parse PDF
    const pdfData = await pdf(buffer);
    const extractedText = pdfData.text;

    // Extract information from text
    const parsedData = parseResumeText(extractedText);

    // Connect to MongoDB
    await connectDB();

    // Save to database
    const profile = await Profile.findOneAndUpdate(
      { userId },
      {
        userId,
        resumePath: `/uploads/resumes/${fileName}`,
        skills: parsedData.skills.map(skill => ({ 
          name: skill, 
          category: 'Technical' 
        })),
        experience: parsedData.experience,
        education: parsedData.education,
        projects: parsedData.projects,
        updatedAt: new Date()
      },
      { 
        upsert: true, 
        new: true 
      }
    );

    // Update user profile completion status
    await UserModel.findOneAndUpdate(
      { clerkId: userId },
      { 
        clerkId: userId,
        isProfileCompleted: true,
        updatedAt: new Date()
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      data: {
        skills: parsedData.skills,
        experienceCount: parsedData.experience.length,
        educationCount: parsedData.education.length,
        projectsCount: parsedData.projects.length
      },
      profileId: profile._id
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload and parse resume' },
      { status: 500 }
    );
  }
}