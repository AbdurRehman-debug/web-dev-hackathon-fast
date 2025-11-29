
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useProfileStatus } from '@/app/hooks/useProfileStatus';

export default function OnboardingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const { isProfileCompleted, isLoading, redirectToDashboard } = useProfileStatus();

  // Redirect if profile is already completed
  useEffect(() => {
    if (!isLoading && isProfileCompleted === true) {
      redirectToDashboard();
    }
  }, [isProfileCompleted, isLoading, redirectToDashboard]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    validateAndSetFile(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    validateAndSetFile(droppedFile);
  };

  const validateAndSetFile = (selectedFile: File | undefined) => {
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setProgress(30);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      setProgress(60);

      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      setProgress(90);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setProgress(100);
      
      console.log('Resume parsed:', data);
      
      // Redirect to dashboard after successful upload
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'Failed to upload resume. Please try again.');
      console.error(err);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isProfileCompleted) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome, {user?.firstName || 'there'}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Upload your resume to get started with your personalized dashboard
          </p>
        </div>

        <div className="space-y-6">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-300 hover:border-indigo-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="resume-upload"
              disabled={uploading}
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              {file ? (
                <>
                  <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-lg font-medium text-gray-700 mb-1">
                    {file.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-lg font-medium text-gray-700 mb-1">
                    Drop your resume here or click to upload
                  </span>
                  <span className="text-sm text-gray-500">
                    PDF only, max 5MB
                  </span>
                </>
              )}
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 text-center flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading and parsing your resume...
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Continue to Dashboard →'
            )}
          </button>

          {/* Info Box */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-indigo-900 mb-1">
                  What we'll extract from your resume:
                </p>
                <ul className="text-sm text-indigo-800 space-y-1">
                  <li>• Technical skills and expertise</li>
                  <li>• Work experience and job history</li>
                  <li>• Education and certifications</li>
                  <li>• Projects and achievements</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
