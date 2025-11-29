"use client";

import React, { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { TrendingUp, AlertCircle, Target, Award, BookOpen } from "lucide-react";

Chart.register(...registerables);

interface Skill {
  name: string;
  category: string;
}

interface Experience {
  company: string;
  position: string;
  description?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

interface Education {
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
}

interface Project {
  name: string;
  description?: string;
  technologies?: string;
}

interface ProfileData {
  userId: string;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  resumePath: string;
}

interface AnalyticsDashboardProps {
  profileData: ProfileData;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  profileData,
}) => {
  const radarChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const radarChartInstance = useRef<Chart | null>(null);
  const barChartInstance = useRef<Chart | null>(null);

  // Calculate analytics from profile data
  const calculateAnalytics = () => {
    console.log(profileData)
    const skillNames = profileData.skills.map((s) => s.name);

    // Skill categories analysis
    const skillsByCategory: { [key: string]: string[] } = {};
    profileData.skills.forEach((skill) => {
      if (!skillsByCategory[skill.category]) {
        skillsByCategory[skill.category] = [];
      }
      skillsByCategory[skill.category].push(skill.name);
    });

    // Industry demand data - checking which skills user has
    const industryDemand = [
      { skill: "React", demand: 95, hasSkill: skillNames.includes("React") },
      { skill: "Python", demand: 90, hasSkill: skillNames.includes("Python") },
      {
        skill: "Kubernetes",
        demand: 85,
        hasSkill: skillNames.includes("Kubernetes"),
      },
      {
        skill: "TypeScript",
        demand: 88,
        hasSkill: skillNames.includes("TypeScript"),
      },
      {
        skill: "GraphQL",
        demand: 75,
        hasSkill: skillNames.includes("GraphQL"),
      },
      {
        skill: "MongoDB",
        demand: 80,
        hasSkill: skillNames.includes("MongoDB"),
      },
      { skill: "Docker", demand: 82, hasSkill: skillNames.includes("Docker") },
      { skill: "AWS", demand: 92, hasSkill: skillNames.includes("AWS") },
    ];

    // Calculate skill coverage
    const allCategories = [
      "Frontend",
      "Backend",
      "Database",
      "DevOps",
      "Testing",
    ];
    const skillCategories = allCategories.map((category) => {
      const categorySkills = skillsByCategory[category] || [];
      const expectedSkills = 3; // Assuming 3 skills per category as benchmark
      const coverage = Math.min(
        100,
        (categorySkills.length / expectedSkills) * 100
      );

      return {
        category,
        skills: categorySkills,
        coverage: Math.round(coverage),
        total: expectedSkills,
        has: categorySkills.length,
      };
    });

    // Calculate strengths (categories with high coverage)
    const strengths = Object.entries(skillsByCategory)
      .filter(([_, skills]) => skills.length > 0)
      .map(([area, skills]) => ({
        area: area + " Development",
        score: Math.min(95, 70 + skills.length * 5),
        skills: skills.slice(0, 5),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Calculate gaps (high demand skills user doesn't have)
    const missingSkills = industryDemand.filter(
      (item) => !item.hasSkill && item.demand >= 75
    );
    const gaps =
      missingSkills.length > 0
        ? [
            {
              area: "High Demand Skills",
              missing: missingSkills.map((s) => s.skill),
              priority: "High" as const,
              demand: Math.round(
                missingSkills.reduce((sum, s) => sum + s.demand, 0) /
                  missingSkills.length
              ),
            },
          ]
        : [];

    // Calculate career score
    const technicalScore = Math.min(
      100,
      Math.round((skillNames.length / 15) * 100)
    );
    const experienceScore = Math.min(
      100,
      Math.round((profileData.experience.length / 3) * 100)
    );
    const educationScore = Math.min(
      100,
      profileData.education.length > 0 ? 80 : 50
    );
    const overallScore = Math.round(
      (technicalScore + experienceScore + educationScore) / 3
    );

    return {
      skillCategories,
      industryDemand,
      strengths,
      gaps,
      careerScore: {
        overall: overallScore,
        technical: technicalScore,
        experience: experienceScore,
        education: educationScore,
      },
      radarData: [
        {
          skill: "Frontend",
          value: Math.min(
            100,
            (skillsByCategory["Frontend"]?.length || 0) * 20
          ),
        },
        {
          skill: "Backend",
          value: Math.min(100, (skillsByCategory["Backend"]?.length || 0) * 20),
        },
        {
          skill: "Database",
          value: Math.min(
            100,
            (skillsByCategory["Database"]?.length || 0) * 20
          ),
        },
        {
          skill: "Cloud/DevOps",
          value: Math.min(100, (skillsByCategory["DevOps"]?.length || 0) * 20),
        },
        {
          skill: "Testing",
          value: Math.min(100, (skillsByCategory["Testing"]?.length || 0) * 20),
        },
        {
          skill: "Experience",
          value: Math.min(100, profileData.experience.length * 30),
        },
      ],
    };
  };

  const analytics = calculateAnalytics();

  // Initialize charts
  useEffect(() => {
    if (!radarChartRef.current || !barChartRef.current) return;

    // Destroy existing charts
    if (radarChartInstance.current) {
      radarChartInstance.current.destroy();
    }
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }

    // Radar Chart
    const radarCtx = radarChartRef.current.getContext("2d");
    if (radarCtx) {
      radarChartInstance.current = new Chart(radarCtx, {
        type: "radar",
        data: {
          labels: analytics.radarData.map((d) => d.skill),
          datasets: [
            {
              label: "Your Skills",
              data: analytics.radarData.map((d) => d.value),
              backgroundColor: "rgba(139, 92, 246, 0.2)",
              borderColor: "rgba(139, 92, 246, 1)",
              borderWidth: 2,
              pointBackgroundColor: "rgba(139, 92, 246, 1)",
              pointBorderColor: "#fff",
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: "rgba(139, 92, 246, 1)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 20,
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    }

    // Bar Chart
    const barCtx = barChartRef.current.getContext("2d");
    if (barCtx) {
      barChartInstance.current = new Chart(barCtx, {
        type: "bar",
        data: {
          labels: analytics.industryDemand.map((item) => item.skill),
          datasets: [
            {
              label: "Market Demand %",
              data: analytics.industryDemand.map((item) => item.demand),
              backgroundColor: analytics.industryDemand.map((item) =>
                item.hasSkill
                  ? "rgba(16, 185, 129, 0.8)"
                  : "rgba(239, 68, 68, 0.8)"
              ),
              borderColor: analytics.industryDemand.map((item) =>
                item.hasSkill ? "rgba(16, 185, 129, 1)" : "rgba(239, 68, 68, 1)"
              ),
              borderWidth: 1,
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 20,
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    }

    return () => {
      if (radarChartInstance.current) {
        radarChartInstance.current.destroy();
      }
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
    };
  }, [analytics]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Resume Analytics
          </h1>
          <p className="text-gray-600">
            Comprehensive analysis of your profile strengths and improvement
            areas
          </p>
        </div>

        {/* Career Readiness Score */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Career Readiness Score
              </h2>
              <p className="text-indigo-100">
                Based on skills, experience, and market demand
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold">
                {analytics.careerScore.overall}
              </div>
              <div className="text-sm text-indigo-200">out of 100</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded p-3">
              <div className="text-2xl font-bold">
                {analytics.careerScore.technical}
              </div>
              <div className="text-sm text-indigo-200">Technical Skills</div>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="text-2xl font-bold">
                {analytics.careerScore.experience}
              </div>
              <div className="text-sm text-indigo-200">Experience</div>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="text-2xl font-bold">
                {analytics.careerScore.education}
              </div>
              <div className="text-sm text-indigo-200">Education</div>
            </div>
          </div>
        </div>

        {/* Strengths and Gaps Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-green-600" size={24} />
              <h3 className="text-xl font-semibold text-gray-900">
                Your Strengths
              </h3>
            </div>
            {analytics.strengths.length > 0 ? (
              <div className="space-y-4">
                {analytics.strengths.map((strength, idx) => (
                  <div key={idx} className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {strength.area}
                      </h4>
                      <span className="text-green-600 font-bold">
                        {strength.score}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {strength.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                Add more skills to see your strengths
              </p>
            )}
          </div>

          {/* Gaps */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="text-orange-600" size={24} />
              <h3 className="text-xl font-semibold text-gray-900">
                Skill Gaps
              </h3>
            </div>
            {analytics.gaps.length > 0 ? (
              <div className="space-y-4">
                {analytics.gaps.map((gap, idx) => (
                  <div key={idx} className="border-l-4 border-orange-500 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {gap.area}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          gap.priority === "High"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {gap.priority} Priority
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {gap.missing.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Market demand: {gap.demand}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                Great! You have all the high-demand skills
              </p>
            )}
          </div>
        </div>

        {/* Skill Coverage Analysis */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-blue-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">
              Skill Coverage by Category
            </h3>
          </div>
          <div className="space-y-4">
            {analytics.skillCategories.map((category, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      {category.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {category.has} of {category.total} skills
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {category.coverage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      category.coverage >= 80
                        ? "bg-green-500"
                        : category.coverage >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${category.coverage}%` }}
                  />
                </div>
                {category.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {category.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Radar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Skill Proficiency Overview
            </h3>
            <div className="h-80">
              <canvas ref={radarChartRef}></canvas>
            </div>
          </div>

          {/* Market Demand Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Skills vs Market Demand
            </h3>
            <div className="h-80">
              <canvas ref={barChartRef}></canvas>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>You have this skill</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Gap to fill</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="text-indigo-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">
              Personalized Recommendations
            </h3>
          </div>
          {analytics.gaps.length > 0 && analytics.gaps[0].missing.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {analytics.gaps[0].missing.slice(0, 3).map((skill, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="text-indigo-600 mb-2">
                    <Award size={32} />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Learn {skill}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    High market demand skill that will enhance your profile
                  </p>
                  <button className="text-sm text-indigo-600 font-semibold hover:text-indigo-700">
                    Start Learning →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              Keep building your skills! Upload your resume to get personalized
              recommendations.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
