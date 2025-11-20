import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { resumeApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Resume {
  id: string;
  fileName: string;
  parsedData: {
    name?: string;
    email?: string;
    phone?: string;
    skills?: string[];
    experience?: Array<{
      title: string;
      company: string;
      startDate?: string;
      endDate?: string;
      description?: string;
    }>;
    education?: Array<{
      degree: string;
      institution: string;
      year?: string;
    }>;
    projects?: Array<{
      name: string;
      description?: string;
      technologies?: string[];
    }>;
  };
  rawText: string;
  links?: {
    id: string;
    url: string;
    type: string;
  }[];
  createdAt: string;
}

const ResumeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlightKeyword, setHighlightKeyword] = useState('');
  const [mandatorySkills, setMandatorySkills] = useState<string[]>([]);
  const [optionalSkills, setOptionalSkills] = useState<string[]>([]);
  const [mandatoryExperience, setMandatoryExperience] = useState<string[]>([]);
  const [optionalExperience, setOptionalExperience] = useState<string[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (id) {
      fetchResume();
    }
  }, [id]);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const data = await resumeApi.getOne(id!);
      setResume(data);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch resume';
      showToast(message, 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  // Check if mandatory requirements are met
  const checkMandatoryRequirements = () => {
    if (!resume || mandatorySkills.length === 0) return { met: true, missing: [] };
    
    const resumeSkills = (resume.parsedData?.skills || []).map((s: string) => s.toLowerCase());
    const missing = mandatorySkills.filter(
      (skill) => !resumeSkills.some((rs: string) => rs.includes(skill.toLowerCase()))
    );
    
    return { met: missing.length === 0, missing };
  };

  // Check optional skills/experience matches
  const getMatchedOptionalSkills = () => {
    if (!resume || optionalSkills.length === 0) return [];
    const resumeSkills = (resume.parsedData?.skills || []).map((s: string) => s.toLowerCase());
    return optionalSkills.filter((skill) =>
      resumeSkills.some((rs: string) => rs.includes(skill.toLowerCase()))
    );
  };

  const getMatchedOptionalExperience = () => {
    if (!resume || optionalExperience.length === 0) return [];
    const resumeExp = resume.parsedData?.experience || [];
    const allExpText = resumeExp
      .map((exp: any) => `${exp.title} ${exp.company} ${exp.description || ''}`)
      .join(' ')
      .toLowerCase();
    
    return optionalExperience.filter((exp) =>
      allExpText.includes(exp.toLowerCase())
    );
  };

  const mandatoryCheck = checkMandatoryRequirements();
  const matchedOptionalSkills = getMatchedOptionalSkills();
  const matchedOptionalExperience = getMatchedOptionalExperience();

  const parseDate = (value?: string) => {
    if (!value) return null;
    const normalized = value.trim();
    if (!normalized) return null;
    if (/present/i.test(normalized)) {
      return new Date();
    }
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    const yearMatch = normalized.match(/\d{4}/);
    if (yearMatch) {
      return new Date(parseInt(yearMatch[0], 10), 0, 1);
    }
    return null;
  };

  const calculateDurationYears = (start?: string, end?: string) => {
    const startDate = parseDate(start);
    const endDate = parseDate(end) || new Date();
    if (!startDate) return 0;
    const diff = endDate.getTime() - startDate.getTime();
    if (diff <= 0) {
      return 0;
    }
    return diff / (1000 * 60 * 60 * 24 * 365);
  };

  const experienceChartData = useMemo(() => {
    const experience = resume?.parsedData?.experience || [];
    const companyTotals: Record<string, number> = {};
    experience.forEach((exp) => {
      const company = exp.company?.trim() || 'Experience';
      const years = calculateDurationYears(exp.startDate, exp.endDate);
      if (!years) {
        return;
      }
      companyTotals[company] = (companyTotals[company] || 0) + years;
    });

    return Object.entries(companyTotals).map(([company, years]) => ({
      company,
      years: Number(years.toFixed(2)),
    }));
  }, [resume]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (!resume) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 transition-colors">
          {/* HR Requirements Input Section */}
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Job Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mandatory Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={mandatorySkills.join(', ')}
                  onChange={(e) => setMandatorySkills(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="e.g., JavaScript, React, Node.js"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Optional Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={optionalSkills.join(', ')}
                  onChange={(e) => setOptionalSkills(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="e.g., TypeScript, Docker, AWS"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mandatory Experience (comma-separated)
                </label>
                <input
                  type="text"
                  value={mandatoryExperience.join(', ')}
                  onChange={(e) => setMandatoryExperience(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="e.g., Full Stack Developer, 5 years"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Optional Experience (comma-separated)
                </label>
                <input
                  type="text"
                  value={optionalExperience.join(', ')}
                  onChange={(e) => setOptionalExperience(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="e.g., Team Lead, Agile"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Mandatory Requirements Warning */}
          {mandatorySkills.length > 0 && !mandatoryCheck.met && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 rounded-lg">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-red-500 dark:text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300">
                    This candidate does not fit the mandatory requirements for the role.
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    Missing: {mandatoryCheck.missing.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Optional Skills Matches */}
          {matchedOptionalSkills.length > 0 && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 rounded-lg">
              <p className="font-semibold text-green-800 dark:text-green-300 mb-2">
                Matched Optional Skills:
              </p>
              <div className="flex flex-wrap gap-2">
                {matchedOptionalSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Optional Experience Matches */}
          {matchedOptionalExperience.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 rounded-lg">
              <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                Matched Optional Experience:
              </p>
              <div className="flex flex-wrap gap-2">
                {matchedOptionalExperience.map((exp, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            </div>
          )}

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {resume.parsedData?.name || resume.fileName}
          </h1>

          {/* Contact Information */}
          {(resume.parsedData?.email || resume.parsedData?.phone) && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resume.parsedData.email && (
                  <div className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Email: </span>
                    <span>{resume.parsedData.email}</span>
                  </div>
                )}
                {resume.parsedData.phone && (
                  <div className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Phone: </span>
                    <span>{resume.parsedData.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Professional Links */}
          {resume.links && resume.links.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Professional Links</h2>
              <div className="flex flex-wrap gap-3">
                {resume.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                      {link.type}
                    </span>
                    <span className="truncate max-w-[180px] sm:max-w-xs">{link.url}</span>
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 3h7m0 0v7m0-7L10 14" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10v11h11" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {resume.parsedData?.skills && resume.parsedData.skills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {resume.parsedData.skills.map((skill, idx) => {
                  const skillLower = skill.toLowerCase();
                  const isMandatory = mandatorySkills.some(ms => skillLower.includes(ms.toLowerCase()));
                  const isOptional = optionalSkills.some(os => skillLower.includes(os.toLowerCase()));
                  
                  let className = "px-3 py-1 rounded-full text-sm";
                  if (isMandatory) {
                    className += " bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-400 dark:border-red-500";
                  } else if (isOptional) {
                    className += " bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-400 dark:border-green-500";
                  } else {
                    className += " bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
                  }
                  
                  return (
                    <span key={idx} className={className}>
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Experience Timeline */}
          {resume.parsedData?.experience && resume.parsedData.experience.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Work Experience</h2>
              <div className="space-y-6">
                {resume.parsedData.experience.map((exp, idx) => {
                  const expText = `${exp.title} ${exp.company} ${exp.description || ''}`.toLowerCase();
                  const hasOptionalMatch = optionalExperience.some(oe => expText.includes(oe.toLowerCase()));
                  const hasMandatoryMatch = mandatoryExperience.some(me => expText.includes(me.toLowerCase()));
                  
                  let borderColor = 'border-blue-500 dark:border-blue-400';
                  if (hasMandatoryMatch) {
                    borderColor = 'border-red-500 dark:border-red-400';
                  } else if (hasOptionalMatch) {
                    borderColor = 'border-green-500 dark:border-green-400';
                  }
                  
                  return (
                    <div key={idx} className={`border-l-4 ${borderColor} pl-4 ${hasOptionalMatch ? 'bg-green-50 dark:bg-green-900/10 p-3 rounded-r-lg' : ''}`}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{exp.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{exp.company}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {exp.startDate} - {exp.endDate || 'Present'}
                      </p>
                      {exp.description && (
                        <p className="mt-2 text-gray-700 dark:text-gray-300">{exp.description}</p>
                      )}
                      {hasOptionalMatch && (
                        <span className="inline-block mt-2 px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                          Matches optional requirement
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {experienceChartData.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Experience Timeline</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={experienceChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="company" />
                      <YAxis
                        label={{
                          value: 'Years',
                          angle: -90,
                          position: 'insideLeft',
                          fill: '#9CA3AF',
                        }}
                        tickFormatter={(value) => Number(value).toFixed(1)}
                      />
                      <Tooltip
                        formatter={(value: any) => `${Number(value).toFixed(2)} yrs`}
                        labelFormatter={(label) => `Company: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="years"
                        stroke="#3B82F6"
                        name="Years of Experience"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Education */}
          {resume.parsedData?.education && resume.parsedData.education.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Education</h2>
              <div className="space-y-4">
                {resume.parsedData.education.map((edu, idx) => (
                  <div key={idx} className="border-l-4 border-green-500 dark:border-green-400 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{edu.degree}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{edu.institution}</p>
                    {edu.year && <p className="text-sm text-gray-500 dark:text-gray-500">{edu.year}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resume.parsedData?.projects && resume.parsedData.projects.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resume.parsedData.projects.map((project, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{project.name}</h3>
                    {project.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-2">{project.description}</p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, techIdx) => (
                          <span
                            key={techIdx}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keyword Highlight */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Raw Text with Keyword Highlight</h2>
            <input
              type="text"
              placeholder="Enter keyword to highlight..."
              value={highlightKeyword}
              onChange={(e) => setHighlightKeyword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
            />
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                {highlightText(resume.rawText, highlightKeyword)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeDetail;

