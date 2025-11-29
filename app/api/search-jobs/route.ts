// app/api/search-jobs/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB  from '@/app/mongoose/index';
import { Profile } from '@/app/mongoose/models';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salary?: string;
  jobType: string;
  postedDate: string;
  url: string;
}

interface JobMatch extends Job {
  compatibilityScore: number;
  matchReasons: {
    skillsMatch: string[];
    experienceMatch: string;
    educationMatch: string;
    missingSkills: string[];
  };
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keywords = searchParams.get('keywords') || '';
    const location = searchParams.get('location') || '';
    const jobType = searchParams.get('jobType') || 'all';
    const experienceLevel = searchParams.get('experienceLevel') || 'all';

    // Connect to database and get user profile
    await connectDB();
    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Scrape jobs from multiple sources
    const jobs = await scrapeJobs(keywords, location, jobType, experienceLevel);

    // Match jobs with user profile
    const matchedJobs = jobs.map(job => matchJobWithProfile(job, profile));

    // Sort by compatibility score
    matchedJobs.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return NextResponse.json({ 
      jobs: matchedJobs,
      count: matchedJobs.length 
    });

  } catch (error: any) {
    console.error('Job search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search jobs' },
      { status: 500 }
    );
  }
}

async function scrapeJobs(
  keywords: string,
  location: string,
  jobType: string,
  experienceLevel: string
): Promise<Job[]> {
  const jobs: Job[] = [];

  try {
    // Build search query
    const searchQuery = keywords || 'software engineer developer';
    const locationQuery = location || 'remote';

    // Scrape from multiple sources in parallel
    const [indeedJobs, linkedinJobs, remoteOkJobs] = await Promise.all([
      scrapeIndeed(searchQuery, locationQuery, jobType),
      scrapeLinkedIn(searchQuery, locationQuery, jobType),
      scrapeRemoteOK(searchQuery, jobType)
    ]);

    jobs.push(...indeedJobs, ...linkedinJobs, ...remoteOkJobs);

    // Remove duplicates based on title and company
    const uniqueJobs = jobs.filter((job, index, self) =>
      index === self.findIndex(j => 
        j.title.toLowerCase() === job.title.toLowerCase() && 
        j.company.toLowerCase() === job.company.toLowerCase()
      )
    );

    return uniqueJobs;
  } catch (error) {
    console.error('Error scraping jobs:', error);
    return jobs;
  }
}

async function scrapeIndeed(query: string, location: string, jobType: string): Promise<Job[]> {
  // In production, you'd use a proper scraping service or API
  // For this example, we'll return mock data that simulates scraped results
  
  const mockJobs: Job[] = [
    {
      id: `indeed-1-${Date.now()}`,
      title: 'Senior Full Stack Developer',
      company: 'TechCorp Solutions',
      location: 'Remote',
      description: 'We are seeking an experienced Full Stack Developer to join our growing team. You will work on cutting-edge web applications using React, Node.js, and PostgreSQL.',
      requirements: [
        '5+ years of experience with JavaScript/TypeScript',
        'Strong proficiency in React and Node.js',
        'Experience with PostgreSQL or similar databases',
        'Familiarity with Docker and CI/CD',
        'Excellent problem-solving skills'
      ],
      salary: '$120k - $160k',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://www.indeed.com/job/12345'
    },
    {
      id: `indeed-2-${Date.now()}`,
      title: 'React Developer',
      company: 'Innovative Apps Inc',
      location: 'New York, NY',
      description: 'Join our team to build responsive and performant web applications. We use modern tools like React, TypeScript, and Tailwind CSS.',
      requirements: [
        '3+ years React experience',
        'TypeScript proficiency',
        'Experience with REST APIs',
        'Knowledge of modern CSS frameworks',
        'Git version control'
      ],
      salary: '$100k - $140k',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://www.indeed.com/job/12346'
    },
    {
      id: `indeed-3-${Date.now()}`,
      title: 'Junior Software Engineer',
      company: 'StartupXYZ',
      location: 'San Francisco, CA',
      description: 'Looking for a motivated junior developer to join our engineering team. Great opportunity to learn and grow.',
      requirements: [
        '1-2 years programming experience',
        'Knowledge of JavaScript or Python',
        'Familiarity with web development',
        'Strong communication skills',
        'Eagerness to learn'
      ],
      salary: '$80k - $100k',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://www.indeed.com/job/12347'
    }
  ];

  return mockJobs.filter(job => 
    jobType === 'all' || job.jobType.toLowerCase() === jobType.toLowerCase()
  );
}

async function scrapeLinkedIn(query: string, location: string, jobType: string): Promise<Job[]> {
  const mockJobs: Job[] = [
    {
      id: `linkedin-1-${Date.now()}`,
      title: 'Backend Engineer - Node.js',
      company: 'CloudScale Technologies',
      location: 'Remote - US',
      description: 'We are building scalable microservices and need a talented backend engineer with Node.js expertise.',
      requirements: [
        'Strong Node.js and Express experience',
        'PostgreSQL or MongoDB knowledge',
        'RESTful API design',
        'Docker and Kubernetes',
        'AWS or similar cloud platform'
      ],
      salary: '$110k - $150k',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://www.linkedin.com/jobs/view/12345'
    },
    {
      id: `linkedin-2-${Date.now()}`,
      title: 'Full Stack Developer',
      company: 'DataFlow Systems',
      location: 'Austin, TX (Hybrid)',
      description: 'Join our team working on data visualization tools and analytics dashboards using React and Python.',
      requirements: [
        'React and TypeScript',
        'Python (Django or Flask)',
        'Data visualization libraries',
        'SQL databases',
        'Agile methodology'
      ],
      salary: '$105k - $135k',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://www.linkedin.com/jobs/view/12346'
    }
  ];

  return mockJobs.filter(job => 
    jobType === 'all' || job.jobType.toLowerCase() === jobType.toLowerCase()
  );
}

async function scrapeRemoteOK(query: string, jobType: string): Promise<Job[]> {
  const mockJobs: Job[] = [
    {
      id: `remoteok-1-${Date.now()}`,
      title: 'Remote Frontend Developer',
      company: 'GlobalTech Remote',
      location: 'Worldwide Remote',
      description: 'Build beautiful user interfaces for our SaaS platform. Work from anywhere with a fully distributed team.',
      requirements: [
        'React and modern JavaScript',
        'CSS/Tailwind expertise',
        'Responsive design',
        'Git workflow',
        'Strong communication for remote work'
      ],
      salary: '$90k - $130k',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://remoteok.com/remote-jobs/12345'
    },
    {
      id: `remoteok-2-${Date.now()}`,
      title: 'Python Developer (ML Focus)',
      company: 'AI Innovations',
      location: 'Remote',
      description: 'Work on machine learning pipelines and data processing systems using Python and modern ML frameworks.',
      requirements: [
        'Strong Python skills',
        'Machine Learning experience',
        'TensorFlow or PyTorch',
        'Data processing (Pandas, NumPy)',
        'REST API development'
      ],
      salary: '$115k - $145k',
      jobType: 'Full-time',
      postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://remoteok.com/remote-jobs/12346'
    }
  ];

  return mockJobs.filter(job => 
    jobType === 'all' || job.jobType.toLowerCase() === jobType.toLowerCase()
  );
}

interface ProfileData {
  userId: string;
  skills: Array<{ name: string; category: string }>;
  experience: Array<{
    company: string;
    position: string;
    description?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  projects: Array<{
    name: string;
    description?: string;
    technologies?: string;
  }>;
}

function matchJobWithProfile(job: Job, profile: ProfileData): JobMatch {
  // Extract user skills
  const userSkills = profile.skills.map((skill) => skill.name.toLowerCase());
  
  // Extract job requirements and keywords
  const jobKeywords = extractKeywords(job.title + ' ' + job.description + ' ' + job.requirements.join(' '));
  
  // Calculate skill matches
  const skillsMatch: string[] = [];
  const missingSkills: string[] = [];
  
  jobKeywords.forEach(keyword => {
    const matched = userSkills.some(skill => 
      skill.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(skill)
    );
    
    if (matched) {
      const matchedSkill = profile.skills.find((skill) => 
        skill.name.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(skill.name.toLowerCase())
      );
      if (matchedSkill && !skillsMatch.includes(matchedSkill.name)) {
        skillsMatch.push(matchedSkill.name);
      }
    } else {
      if (!missingSkills.includes(keyword)) {
        missingSkills.push(keyword);
      }
    }
  });

  // Calculate experience match
  const experienceYears = calculateExperienceYears(profile.experience);
  const experienceMatch = getExperienceMatchDescription(experienceYears, job.title);

  // Calculate education match
  const educationMatch = profile.education.length > 0 
    ? `${profile.education[0].degree} in ${profile.education[0].field || 'Computer Science'}`
    : 'Relevant work experience';

  // Calculate compatibility score
  const skillMatchPercentage = (skillsMatch.length / Math.max(jobKeywords.length, 1)) * 100;
  const experienceScore = Math.min(experienceYears * 10, 40);
  const educationScore = profile.education.length > 0 ? 20 : 10;
  
  const compatibilityScore = Math.min(
    Math.round(skillMatchPercentage * 0.6 + experienceScore * 0.8 + educationScore),
    99
  );

  return {
    ...job,
    compatibilityScore,
    matchReasons: {
      skillsMatch,
      experienceMatch,
      educationMatch,
      missingSkills: missingSkills.slice(0, 5)
    }
  };
}

function extractKeywords(text: string): string[] {
  const techKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js',
    'Angular', 'Vue', 'Express', 'Django', 'Flask', 'PostgreSQL',
    'MongoDB', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS',
    'Azure', 'GCP', 'Git', 'CI/CD', 'REST API', 'GraphQL',
    'TensorFlow', 'PyTorch', 'Machine Learning', 'AI', 'Agile',
    'Scrum', 'Microservices', 'HTML', 'CSS', 'Tailwind', 'Bootstrap'
  ];

  const foundKeywords = techKeywords.filter(keyword =>
    new RegExp(`\\b${keyword}\\b`, 'gi').test(text)
  );

  return [...new Set(foundKeywords)];
}

function calculateExperienceYears(experience: ProfileData['experience']): number {
  if (!experience || experience.length === 0) return 0;

  let totalMonths = 0;

  experience.forEach(exp => {
    const start = new Date(exp.startDate);
   const end = exp.current ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date());
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += Math.max(months, 0);
  });

  return Math.round(totalMonths / 12);
}

function getExperienceMatchDescription(years: number, jobTitle: string): string {
  if (years >= 5) {
    return `Your ${years} years of experience makes you well-qualified for this role`;
  } else if (years >= 3) {
    return `Your ${years} years of experience aligns with this position`;
  } else if (years >= 1) {
    return `Your ${years} years of experience is a good foundation for this role`;
  } else {
    return 'Entry-level position suitable for building experience';
  }
}