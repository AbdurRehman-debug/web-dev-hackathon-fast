'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

interface JobMatch {
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
  compatibilityScore: number;
  matchReasons: {
    skillsMatch: string[];
    experienceMatch: string;
    educationMatch: string;
    missingSkills: string[];
  };
}

export default function JobSearchPage() {
  const { user } = useUser();
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useState({
    keywords: '',
    location: '',
    jobType: 'all',
    experienceLevel: 'all'
  });
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    
    try {
      const queryParams = new URLSearchParams({
        keywords: searchParams.keywords,
        location: searchParams.location,
        jobType: searchParams.jobType,
        experienceLevel: searchParams.experienceLevel
      });

      const response = await fetch(`/api/search-jobs?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to search jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to search jobs');
    } finally {
      setLoading(false);
    }
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'relevance') {
      return b.compatibilityScore - a.compatibilityScore;
    } else {
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Consider';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
              <p className="text-gray-600 mt-2">AI-powered job matching based on your profile</p>
            </div>
          </div>
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords
              </label>
              <input
                type="text"
                value={searchParams.keywords}
                onChange={(e) => setSearchParams({...searchParams, keywords: e.target.value})}
                placeholder="e.g. React Developer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={searchParams.location}
                onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
                placeholder="e.g. Remote, New York"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <select
                value={searchParams.jobType}
                onChange={(e) => setSearchParams({...searchParams, jobType: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                value={searchParams.experienceLevel}
                onChange={(e) => setSearchParams({...searchParams, experienceLevel: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Jobs
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Results Header */}
        {jobs.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              Found <span className="font-semibold text-gray-900">{jobs.length}</span> matching jobs
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="relevance">Sort by Relevance</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
        )}

        {/* Job Listings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Jobs List */}
          <div className="lg:col-span-2 space-y-4">
            {sortedJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-lg ${
                  selectedJob?.id === job.id ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {job.title}
                    </h3>
                    <p className="text-indigo-600 font-medium">{job.company}</p>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(job.compatibilityScore)}`}>
                      {job.compatibilityScore}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{getScoreLabel(job.compatibilityScore)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {job.jobType}
                  </span>
                  {job.salary && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {job.salary}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {job.matchReasons.skillsMatch.slice(0, 4).map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      ✓ {skill}
                    </span>
                  ))}
                  {job.matchReasons.skillsMatch.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{job.matchReasons.skillsMatch.length - 4} more
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Posted {new Date(job.postedDate).toLocaleDateString()}
                </div>
              </div>
            ))}

            {!loading && jobs.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600">Try adjusting your search filters to find more opportunities</p>
              </div>
            )}
          </div>

          {/* Job Details Sidebar */}
          <div className="lg:col-span-1">
            {selectedJob ? (
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <div className="mb-4">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getScoreColor(selectedJob.compatibilityScore)} mb-3`}>
                    {selectedJob.compatibilityScore}% Match
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedJob.title}
                  </h2>
                  <p className="text-indigo-600 font-medium text-lg">{selectedJob.company}</p>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Why this matches you:</h3>
                  
                  <div className="space-y-3">
                    {selectedJob.matchReasons.skillsMatch.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Matching Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.matchReasons.skillsMatch.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedJob.matchReasons.experienceMatch && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Experience:</p>
                        <p className="text-sm text-gray-600">{selectedJob.matchReasons.experienceMatch}</p>
                      </div>
                    )}

                    {selectedJob.matchReasons.educationMatch && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Education:</p>
                        <p className="text-sm text-gray-600">{selectedJob.matchReasons.educationMatch}</p>
                      </div>
                    )}

                    {selectedJob.matchReasons.missingSkills.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Skills to develop:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.matchReasons.missingSkills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Requirements:</h3>
                  <ul className="space-y-2">
                    {selectedJob.requirements.slice(0, 5).map((req, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-indigo-600 mt-1">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={selectedJob.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-indigo-600 text-white text-center py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Apply Now
                </a>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center sticky top-4">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 text-sm">
                  Select a job to see detailed match analysis
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}