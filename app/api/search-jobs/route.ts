// app/api/search-jobs/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/app/mongoose/index';
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

    // Fetch jobs from multiple real APIs
    const jobs = await fetchJobs(keywords, location, jobType, experienceLevel);

    if (jobs.length === 0) {
      return NextResponse.json({ 
        jobs: [],
        count: 0,
        message: 'No jobs found. Try adjusting your search criteria.'
      });
    }

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

async function fetchJobs(
  keywords: string,
  location: string,
  jobType: string,
  experienceLevel: string
): Promise<Job[]> {
  const jobs: Job[] = [];

  try {
    const searchQuery = keywords || 'software engineer';
    const locationQuery = location || 'remote';

    // Fetch from multiple sources in parallel
    const results = await Promise.allSettled([
      fetchFromJSearch(searchQuery, locationQuery),
      fetchFromRemotive(searchQuery)
    ]);

    // Collect successful results
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        jobs.push(...result.value);
      }
    });

    // Remove duplicates
    const uniqueJobs = jobs.filter((job, index, self) =>
      index === self.findIndex(j => 
        j.title.toLowerCase().trim() === job.title.toLowerCase().trim() && 
        j.company.toLowerCase().trim() === job.company.toLowerCase().trim()
      )
    );

    // Filter by job type if specified
    if (jobType !== 'all') {
      return uniqueJobs.filter(job => 
        job.jobType.toLowerCase().includes(jobType.toLowerCase())
      );
    }

    return uniqueJobs.slice(0, 50); // Limit to 50 jobs

  } catch (error) {
    console.error('Error fetching jobs:', error);
    return jobs;
  }
}

// JSearch API (RapidAPI) - Best for diverse job sources
async function fetchFromJSearch(query: string, location: string): Promise<Job[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  
  if (!apiKey) {
    console.warn('RAPIDAPI_KEY not found in environment variables');
    return [];
  }

  try {
    const url = new URL('https://jsearch.p.rapidapi.com/search');
    url.searchParams.append('query', `${query} in ${location}`);
    url.searchParams.append('page', '1');
    url.searchParams.append('num_pages', '1');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`JSearch API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.slice(0, 20).map((job: any) => ({
      id: `jsearch-${job.job_id || Math.random()}`,
      title: job.job_title || 'Unknown Title',
      company: job.employer_name || 'Unknown Company',
      location: job.job_city && job.job_state 
        ? `${job.job_city}, ${job.job_state}` 
        : job.job_country || 'Remote',
      description: job.job_description || 'No description available',
      requirements: extractRequirements(job.job_description || ''),
      salary: job.job_salary_currency && job.job_min_salary
        ? `${job.job_salary_currency} ${formatSalary(job.job_min_salary)}-${formatSalary(job.job_max_salary || job.job_min_salary)}`
        : undefined,
      jobType: job.job_employment_type || 'Full-time',
      postedDate: job.job_posted_at_datetime_utc || new Date().toISOString(),
      url: job.job_apply_link || job.job_google_link || '#'
    }));

  } catch (error) {
    console.error('JSearch API error:', error);
    return [];
  }
}

// Adzuna API - Free tier, good coverage
async function fetchFromAdzuna(query: string, location: string): Promise<Job[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.warn('ADZUNA_APP_ID or ADZUNA_APP_KEY not found in environment variables');
    return [];
  }

  try {
    const country = 'us'; // Change based on your target country
    const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);
    url.searchParams.append('app_id', appId);
    url.searchParams.append('app_key', appKey);
    url.searchParams.append('results_per_page', '20');
    url.searchParams.append('what', query);
    url.searchParams.append('where', location);
    url.searchParams.append('content-type', 'application/json');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((job: any) => ({
      id: `adzuna-${job.id}`,
      title: job.title || 'Unknown Title',
      company: job.company?.display_name || 'Unknown Company',
      location: job.location?.display_name || 'Remote',
      description: job.description || 'No description available',
      requirements: extractRequirements(job.description || ''),
      salary: job.salary_min && job.salary_max
        ? `$${formatSalary(job.salary_min)}-${formatSalary(job.salary_max)}`
        : undefined,
      jobType: job.contract_time || 'Full-time',
      postedDate: job.created || new Date().toISOString(),
      url: job.redirect_url || '#'
    }));

  } catch (error) {
    console.error('Adzuna API error:', error);
    return [];
  }
}

// Remotive API - Remote jobs (free, no auth required)
async function fetchFromRemotive(query: string): Promise<Job[]> {
  try {
    const url = 'https://remotive.com/api/remote-jobs?limit=20';
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Remotive API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.jobs || !Array.isArray(data.jobs)) {
      return [];
    }

    // Filter by query
    const filteredJobs = data.jobs.filter((job: any) => {
      const searchText = `${job.title} ${job.company_name} ${job.description}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });

    return filteredJobs.slice(0, 15).map((job: any) => ({
      id: `remotive-${job.id}`,
      title: job.title || 'Unknown Title',
      company: job.company_name || 'Unknown Company',
      location: 'Remote',
      description: job.description || 'No description available',
      requirements: extractRequirements(job.description || ''),
      salary: job.salary || undefined,
      jobType: job.job_type || 'Full-time',
      postedDate: job.publication_date || new Date().toISOString(),
      url: job.url || '#'
    }));

  } catch (error) {
    console.error('Remotive API error:', error);
    return [];
  }
}

function extractRequirements(description: string): string[] {
  const requirements: string[] = [];
  
  // Common patterns for requirements
  const patterns = [
    /(?:require|requirement|must have|should have|need)[:\s]+([^.]+)/gi,
    /(?:experience with|proficient in|knowledge of)[:\s]+([^.]+)/gi,
    /(?:\d+\+?\s*years?\s*(?:of)?\s*experience\s*(?:in|with)?[:\s]+)([^.]+)/gi,
  ];

  patterns.forEach(pattern => {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const req = match[1].trim().replace(/\n/g, ' ').slice(0, 150);
        if (req.length > 10 && !requirements.includes(req)) {
          requirements.push(req);
        }
      }
    }
  });

  // Extract bullet points
  const bulletPoints = description.match(/[•\-\*]\s*([^\n•\-\*]{10,150})/g);
  if (bulletPoints) {
    bulletPoints.forEach(point => {
      const cleaned = point.replace(/^[•\-\*]\s*/, '').trim();
      if (cleaned.length > 10 && !requirements.includes(cleaned)) {
        requirements.push(cleaned);
      }
    });
  }

  return requirements.slice(0, 8);
}

function formatSalary(amount: number): string {
  if (amount >= 1000) {
    return `${Math.round(amount / 1000)}k`;
  }
  return amount.toString();
}

function matchJobWithProfile(job: Job, profile: ProfileData): JobMatch {
  const userSkills = profile.skills.map((skill) => skill.name.toLowerCase());
  const jobKeywords = extractKeywords(job.title + ' ' + job.description + ' ' + job.requirements.join(' '));
  
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

  const experienceYears = calculateExperienceYears(profile.experience);
  const experienceMatch = getExperienceMatchDescription(experienceYears, job.title);

  const educationMatch = profile.education.length > 0 
    ? `${profile.education[0].degree}${profile.education[0].field ? ' in ' + profile.education[0].field : ''}`
    : 'Relevant work experience';

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