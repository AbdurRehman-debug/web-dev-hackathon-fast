interface ParsedResume {
  skills: string[];
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

export function parseResumeText(text: string): ParsedResume {
  // Clean up the text
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  return {
    skills: extractSkills(cleanText),
    experience: extractExperience(cleanText),
    education: extractEducation(cleanText),
    projects: extractProjects(cleanText)
  };
}

function extractSkills(text: string): string[] {
  const skills: string[] = [];
  
  // Define skills with their display names and search patterns
  const skillKeywords: Array<{ display: string; pattern: string }> = [
    { display: 'JavaScript', pattern: 'JavaScript' },
    { display: 'TypeScript', pattern: 'TypeScript' },
    { display: 'Python', pattern: 'Python' },
    { display: 'Java', pattern: 'Java' },
    { display: 'C++', pattern: 'C\\+\\+' },
    { display: 'C#', pattern: 'C#' },
    { display: 'Ruby', pattern: 'Ruby' },
    { display: 'Go', pattern: 'Go' },
    { display: 'Rust', pattern: 'Rust' },
    { display: 'PHP', pattern: 'PHP' },
    { display: 'React', pattern: 'React' },
    { display: 'Angular', pattern: 'Angular' },
    { display: 'Vue', pattern: 'Vue' },
    { display: 'Next.js', pattern: 'Next\\.js' },
    { display: 'Svelte', pattern: 'Svelte' },
    { display: 'Node.js', pattern: 'Node\\.js' },
    { display: 'Express', pattern: 'Express' },
    { display: 'Django', pattern: 'Django' },
    { display: 'Flask', pattern: 'Flask' },
    { display: 'FastAPI', pattern: 'FastAPI' },
    { display: 'SQL', pattern: 'SQL' },
    { display: 'MongoDB', pattern: 'MongoDB' },
    { display: 'PostgreSQL', pattern: 'PostgreSQL' },
    { display: 'MySQL', pattern: 'MySQL' },
    { display: 'Redis', pattern: 'Redis' },
    { display: 'GraphQL', pattern: 'GraphQL' },
    { display: 'Prisma', pattern: 'Prisma' },
    { display: 'AWS', pattern: 'AWS' },
    { display: 'Azure', pattern: 'Azure' },
    { display: 'GCP', pattern: 'GCP' },
    { display: 'Docker', pattern: 'Docker' },
    { display: 'Kubernetes', pattern: 'Kubernetes' },
    { display: 'CI/CD', pattern: 'CI/CD' },
    { display: 'Jenkins', pattern: 'Jenkins' },
    { display: 'GitHub Actions', pattern: 'GitHub Actions' },
    { display: 'HTML', pattern: 'HTML' },
    { display: 'CSS', pattern: 'CSS' },
    { display: 'Tailwind', pattern: 'Tailwind' },
    { display: 'Bootstrap', pattern: 'Bootstrap' },
    { display: 'SASS', pattern: 'SASS' },
    { display: 'Git', pattern: 'Git' },
    { display: 'GitHub', pattern: 'GitHub' },
    { display: 'GitLab', pattern: 'GitLab' },
    { display: 'Machine Learning', pattern: 'Machine Learning' },
    { display: 'AI', pattern: 'AI' },
    { display: 'Data Science', pattern: 'Data Science' },
    { display: 'TensorFlow', pattern: 'TensorFlow' },
    { display: 'PyTorch', pattern: 'PyTorch' },
    { display: 'Pandas', pattern: 'Pandas' },
    { display: 'NumPy', pattern: 'NumPy' },
    { display: 'REST API', pattern: 'REST API' },
    { display: 'Microservices', pattern: 'Microservices' },
    { display: 'Agile', pattern: 'Agile' },
    { display: 'Scrum', pattern: 'Scrum' },
    { display: 'Testing', pattern: 'Testing' },
    { display: 'Jest', pattern: 'Jest' },
    { display: 'Cypress', pattern: 'Cypress' },
  ];

  // Search in entire text for skills
  skillKeywords.forEach(({ display, pattern }) => {
    try {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      if (regex.test(text)) {
        skills.push(display);
      }
    } catch (error) {
      console.error(`Error processing skill: ${display}`, error);
    }
  });

  return [...new Set(skills)];
}

function extractExperience(text: string): ParsedResume['experience'] {
  const experience: ParsedResume['experience'] = [];
  
  // Look for common experience section headers
  const expHeaderRegex = /(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|PROFESSIONAL EXPERIENCE|WORK HISTORY)/i;
  const expMatch = text.match(new RegExp(`${expHeaderRegex.source}[\\s\\S]*?(?=\\n\\n(?:EDUCATION|PROJECTS?|SKILLS?|CERTIFICATIONS?|$)|$)`, 'i'));
  
  if (!expMatch) {
    // Try to find date patterns anywhere in the document
    const lines = text.split('\n');
    let currentExp: any = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for date patterns like "Aug-03 – Mar-04", "2020-2023", "Jan 2020 - Present"
      const dateMatch = line.match(/(\w{3,9}[\-\s]+\d{2,4})\s*[-–—]\s*(\w{3,9}[\-\s]+\d{2,4}|Present|Current)/i);
      
      if (dateMatch && line.length < 100) {
        // Save previous experience if exists
        if (currentExp) {
          experience.push(currentExp);
        }
        
        // Start new experience
        const [startDate, endDate] = dateMatch[0].split(/[-–—]/).map(d => d.trim());
        const position = lines[i - 1]?.trim() || 'Position';
        const company = lines[i + 1]?.trim() || 'Company';
        
        currentExp = {
          company: company,
          position: position,
          description: '',
          startDate: startDate,
          endDate: endDate || undefined,
          current: /present|current/i.test(endDate || '')
        };
      } else if (currentExp && line && line.length > 20 && !dateMatch) {
        // Add to description
        currentExp.description = (currentExp.description + ' ' + line).trim();
      }
    }
    
    if (currentExp) {
      experience.push(currentExp);
    }
  } else {
    const expSection = expMatch[0];
    const lines = expSection.split('\n').filter(l => l.trim());
    
    let currentExp: any = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      const dateMatch = line.match(/(\w{3,9}[\-\s]+\d{2,4})\s*[-–—]\s*(\w{3,9}[\-\s]+\d{2,4}|Present|Current)/i);
      
      if (dateMatch) {
        if (currentExp) {
          experience.push(currentExp);
        }
        
        const [startDate, endDate] = dateMatch[0].split(/[-–—]/).map(d => d.trim());
        const position = lines[i - 1] || 'Position';
        const company = lines[i + 1] || line.replace(dateMatch[0], '').trim() || 'Company';
        
        currentExp = {
          company: company,
          position: position,
          description: '',
          startDate: startDate,
          endDate: endDate || undefined,
          current: /present|current/i.test(endDate || '')
        };
      } else if (currentExp && line && line.length > 20) {
        currentExp.description = (currentExp.description + ' ' + line).trim();
      }
    }
    
    if (currentExp) {
      experience.push(currentExp);
    }
  }
  
  return experience;
}

function extractEducation(text: string): ParsedResume['education'] {
  const education: ParsedResume['education'] = [];
  
  // Look for education section more strictly
  const eduHeaderRegex = /(?:EDUCATION|ACADEMIC BACKGROUND|QUALIFICATIONS)[\s\n]/i;
  const eduMatch = text.match(new RegExp(`${eduHeaderRegex.source}[\\s\\S]*?(?=\\n(?:EXPERIENCE|PROJECTS?|SKILLS?|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|$))`, 'i'));
  
  // Only search within the education section if found
  if (!eduMatch) {
    return education;
  }
  
  const eduSection = eduMatch[0];
  const lines = eduSection.split('\n').filter(l => l.trim());
  
  // Common degree patterns - more specific
  const degreePatterns = [
    /(?:Bachelor|B\.?A\.?|B\.?S\.?|B\.?Sc\.?|B\.?E\.?|B\.?Tech)(?:\s+of\s+)?(?:Science|Arts|Engineering|Technology|Commerce)?(?:\s+in\s+[\w\s]+)?/gi,
    /(?:Master|M\.?A\.?|M\.?S\.?|M\.?Sc\.?|M\.?E\.?|M\.?Tech|MBA)(?:\s+of\s+)?(?:Science|Arts|Engineering|Technology|Business)?(?:\s+in\s+[\w\s]+)?/gi,
    /(?:Ph\.?D\.?|Doctorate)(?:\s+in\s+[\w\s]+)?/gi,
    /(?:Associate|A\.?A\.?|A\.?S\.?)(?:\s+of\s+)?(?:Science|Arts)?/gi
  ];
  
  let foundDegrees = 0;
  
  for (let i = 0; i < lines.length && foundDegrees < 5; i++) {
    const line = lines[i].trim();
    
    // Skip header line
    if (eduHeaderRegex.test(line)) continue;
    
    for (const pattern of degreePatterns) {
      pattern.lastIndex = 0;
      const match = line.match(pattern);
      
      if (match) {
        const degree = match[0].trim();
        
        // Look for institution in nearby lines
        let institution = '';
        let field = '';
        let startDate = '';
        let endDate = '';
        
        // Check next 3 lines for institution
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const nextLine = lines[j].trim();
          
          // Skip if it's another degree or section header
          if (degreePatterns.some(p => { p.lastIndex = 0; return p.test(nextLine); })) break;
          if (/^(?:EXPERIENCE|PROJECTS?|SKILLS?)$/i.test(nextLine)) break;
          
          // Institution is usually on the next non-empty line
          if (!institution && nextLine.length > 0 && nextLine.length < 100) {
            institution = nextLine;
          }
          
          // Look for dates
          const dateMatches = nextLine.match(/\b(19|20)\d{2}\b/g);
          if (dateMatches) {
            startDate = dateMatches[0];
            endDate = dateMatches[1] || dateMatches[0];
          }
        }
        
        // Extract field from degree if present
        const fieldMatch = degree.match(/\bin\s+([\w\s]+)$/i);
        if (fieldMatch) {
          field = fieldMatch[1].trim();
        }
        
        if (institution) {
          education.push({
            institution: institution,
            degree: degree,
            field: field || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined
          });
          foundDegrees++;
        }
        break;
      }
    }
  }
  
  return education;
}

function extractProjects(text: string): ParsedResume['projects'] {
  const projects: ParsedResume['projects'] = [];
  
  // Look for projects section
  const projHeaderRegex = /(?:PROJECTS?|PORTFOLIO|WORK SAMPLES)/i;
  const projMatch = text.match(new RegExp(`${projHeaderRegex.source}[\\s\\S]*?(?=\\n\\n(?:EXPERIENCE|EDUCATION|SKILLS?|CERTIFICATIONS?|$)|$)`, 'i'));
  
  if (!projMatch) return projects;
  
  const projSection = projMatch[0];
  const lines = projSection.split('\n').filter(l => l.trim());
  
  let currentProject: any = null;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Project titles are usually short and at the start of a line
    if (line && line.length < 100 && line.length > 5 && !line.startsWith('-') && !line.startsWith('•')) {
      // Check if next line is a description (longer text)
      const nextLine = lines[i + 1]?.trim();
      
      if (nextLine && nextLine.length > line.length) {
        if (currentProject) {
          projects.push(currentProject);
        }
        
        currentProject = {
          name: line,
          description: nextLine,
          technologies: undefined
        };
      }
    } else if (currentProject && line && line.length > 20) {
      // Add more description
      currentProject.description = (currentProject.description + ' ' + line).trim();
    }
  }
  
  if (currentProject) {
    projects.push(currentProject);
  }
  
  return projects.slice(0, 10);
}
