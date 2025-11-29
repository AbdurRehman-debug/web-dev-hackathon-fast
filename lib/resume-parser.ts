// lib/resume-parser.ts

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
  return {
    skills: extractSkills(text),
    experience: extractExperience(text),
    education: extractEducation(text),
    projects: extractProjects(text)
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

  const skillsMatch = text.match(/SKILLS?[\s\S]*?(?=\n\n|EXPERIENCE|EDUCATION|PROJECTS|$)/i);
  const skillsSection = skillsMatch ? skillsMatch[0] : text;

  skillKeywords.forEach(({ display, pattern }) => {
    try {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      if (regex.test(skillsSection)) {
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
  
  const expMatch = text.match(/EXPERIENCE[\s\S]*?(?=\n\nEDUCATION|\n\nPROJECTS|\n\nSKILLS|$)/i);
  if (!expMatch) return experience;
  
  const expSection = expMatch[0];
  const lines = expSection.split('\n').filter(l => l.trim());
  
  const datePattern = /(\w+\s+)?\d{4}\s*[-–—]\s*(\w+\s+)?(\d{4}|Present)/gi;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(datePattern);
    
    if (dateMatch) {
      const [startDate, endDate] = dateMatch[0].split(/[-–—]/).map(d => d.trim());
      const position = lines[i - 2] || 'Position';
      const company = lines[i - 1] || 'Company';
      const description = lines[i + 1] || '';
      
      experience.push({
        company: company.trim(),
        position: position.trim(),
        description: description.trim(),
        startDate: startDate,
        endDate: endDate || undefined,
        current: /present/i.test(endDate || '')
      });
    }
  }
  
  return experience;
}

function extractEducation(text: string): ParsedResume['education'] {
  const education: ParsedResume['education'] = [];
  
  const eduMatch = text.match(/EDUCATION[\s\S]*?(?=\n\nEXPERIENCE|\n\nPROJECTS|\n\nSKILLS|$)/i);
  if (!eduMatch) return education;
  
  const eduSection = eduMatch[0];
  const lines = eduSection.split('\n').filter(l => l.trim());
  
  const degreePatterns = [
    /Bachelor(?:'s)?(?:\s+of\s+(?:Science|Arts|Engineering|Business))?/gi,
    /Master(?:'s)?(?:\s+of\s+(?:Science|Arts|Engineering|Business))?/gi,
    /Ph\.?D\.?/gi,
    /B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|MBA/gi
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pattern of degreePatterns) {
      const match = line.match(pattern);
      if (match) {
        const institution = lines[i + 1] || lines[i - 1] || 'Institution';
        const dateMatch = line.match(/\d{4}/g);
        
        education.push({
          institution: institution.trim(),
          degree: match[0],
          field: undefined,
          startDate: dateMatch?.[0],
          endDate: dateMatch?.[1]
        });
        break;
      }
    }
  }
  
  return education;
}

function extractProjects(text: string): ParsedResume['projects'] {
  const projects: ParsedResume['projects'] = [];
  
  const projMatch = text.match(/PROJECTS?[\s\S]*?(?=\n\nEXPERIENCE|\n\nEDUCATION|\n\nSKILLS|$)/i);
  if (!projMatch) return projects;
  
  const projSection = projMatch[0];
  const lines = projSection.split('\n').filter(l => l.trim());
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && line.length > 10 && !line.startsWith('•') && !line.startsWith('-')) {
      const [name, ...rest] = line.split(/[-–—•]/);
      
      projects.push({
        name: name.trim() || line.substring(0, 50),
        description: rest.join(' ').trim() || undefined,
        technologies: undefined
      });
    }
  }
  
  return projects.slice(0, 10);
}
