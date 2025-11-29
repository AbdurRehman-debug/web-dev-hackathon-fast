# Web Dev Hackathon Soventure Fast

An AI-powered job matching platform that helps users find the perfect job opportunities based on their resume and skills. The platform parses resumes, analyzes skills, and matches users with relevant job listings using intelligent algorithms.

## Table of Contents

- [Participants](#participants)
- [LLMs We Are Using](#llms-we-are-using)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Usage](#usage)

## Participants

1. Ali Naqi - f24605014@nutech.edu.pk
2. Abdur Rehman - f24608034@nutech.edu.pk
3. Hamza Ali - f24608045@nutech.edu.pk

## LLMs We Are Using

1. Cursor
2. Claude
3. Chat GPT
4. Gemini

## Features

- **Resume Upload & Parsing**: Upload PDF resumes and automatically extract skills, experience, education, and projects
- **AI-Powered Job Matching**: Intelligent job matching based on user skills and experience with compatibility scores
- **User Dashboard**: Personalized dashboard showing profile status, job recommendations, and analytics
- **Profile Management**: View and update your professional profile with parsed resume data
- **Analytics Dashboard**: Visual analytics showing skill coverage, market demand, career readiness score, and personalized recommendations
- **Job Search**: Search jobs with filters for keywords, location, job type, and experience level
- **Authentication**: Secure user authentication powered by Clerk

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 4** - Utility-first CSS framework
- **Chart.js** - Data visualization for analytics
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **MongoDB with Mongoose** - Database for user profiles and data storage
- **Drizzle ORM** - TypeScript ORM for PostgreSQL (configured for additional database support)
- **Clerk** - Authentication and user management

### AI & Data Processing
- **pdf-parse** - PDF text extraction
- **Custom Resume Parser** - Intelligent skill and experience extraction
- **LangChain** - AI/LLM integration capabilities

### External APIs
- **JSearch (RapidAPI)** - Job search API
- **Remotive API** - Remote job listings

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB database (local or cloud)
- Clerk account for authentication

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AbdurRehman-debug/web-dev-hackathon-fast.git
   cd web-dev-hackathon-fast
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see [Environment Variables](#environment-variables))

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=your_mongodb_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Job Search APIs (Optional)
RAPIDAPI_KEY=your_rapidapi_key_for_jsearch
```

## Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── check-profile/      # Profile status check
│   │   ├── profile/            # Profile management
│   │   ├── search-jobs/        # Job search endpoint
│   │   └── upload-resume/      # Resume upload & parsing
│   ├── analytics/              # Analytics dashboard page
│   ├── components/             # React components
│   │   ├── AnalyticsDashboard.tsx
│   │   └── Navbar.tsx
│   ├── dashboard/              # Main dashboard page
│   ├── hooks/                  # Custom React hooks
│   ├── mongoose/               # MongoDB models & connection
│   │   ├── index.ts            # Database connection
│   │   └── models.ts           # Mongoose schemas
│   ├── onboarding/             # Onboarding/resume upload page
│   ├── profile/                # Profile view page
│   ├── search-jobs/            # Job search page
│   ├── sign-in/                # Sign in page
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── lib/
│   └── resume-parser.ts        # Resume text parsing utilities
├── public/                     # Static assets
├── drizzle.config.ts           # Drizzle ORM config
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies
└── tsconfig.json               # TypeScript configuration
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload-resume` | POST | Upload and parse a PDF resume |
| `/api/profile` | GET | Get user profile data |
| `/api/check-profile` | GET | Check if user profile is complete |
| `/api/search-jobs` | GET | Search jobs with filters |

## Usage

1. **Sign Up/Sign In**: Create an account or sign in using Clerk authentication
2. **Upload Resume**: Upload your PDF resume during onboarding
3. **View Profile**: Review your parsed skills, experience, education, and projects
4. **Search Jobs**: Use the AI-powered job search to find matching opportunities
5. **View Analytics**: Check your career readiness score and skill gap analysis
6. **Apply to Jobs**: Click on matched jobs to apply directly
