import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import connectDB from '@/app/mongoose/index';
import { Profile, UserModel } from "@/app/mongoose/models";
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

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file to server
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileName = `${userId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, fileName);
    
    await writeFile(filePath, buffer);

    // Parse PDF with better error handling
    let extractedText = '';
    let parsedData;
    
    try {
      const pdfData = await pdf(buffer, {
        // More lenient PDF parsing options
        max: 0, // Parse all pages
        version: 'v1.10.100'
      });
      extractedText = pdfData.text;

      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('PDF appears to be empty or corrupted');
      }

      // Extract information from text
      parsedData = parseResumeText(extractedText);

    } catch (pdfError: any) {
      console.error('PDF parsing error:', pdfError);
      
      // If PDF parsing fails, still save the file but with minimal data
      return NextResponse.json({
        error: 'Could not parse PDF content. The file may be corrupted or password-protected.',
        details: pdfError.message,
        suggestion: 'Please try re-saving your PDF or using a different PDF viewer to export it.'
      }, { status: 400 });
    }

    // Validate parsed data
    if (!parsedData.skills.length && !parsedData.experience.length) {
      return NextResponse.json({
        error: 'Could not extract meaningful information from the resume',
        suggestion: 'Please ensure your resume contains clear sections for Skills, Experience, Education, and Projects.'
      }, { status: 400 });
    }

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

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload and parse resume',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};