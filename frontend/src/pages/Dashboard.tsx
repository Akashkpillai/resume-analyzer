import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Navbar from '../components/Navbar';
import { resumeApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Resume {
  id: string;
  fileName: string;
  parsedData: {
    name?: string;
    email?: string;
    skills?: string[];
    experience?: any[];
    education?: any[];
    projects?: any[];
  };
  createdAt: string;
}

interface EvaluatedResume {
  resume: Resume;
  totalExperienceYears: number;
  optionalSkillMatches: string[];
  reasons: string[];
}

const Dashboard = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hrFilters, setHrFilters] = useState({
    mandatorySkills: '',
    optionalSkills: '',
    minExperience: '',
    requiredEducation: '',
  });
  const navigate = useNavigate();
  const { showToast } = useToast();

  const parseList = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

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

  const getTotalExperienceYears = (experience: any[] = []) =>
    experience.reduce((totalYears, exp) => {
      return totalYears + calculateDurationYears(exp.startDate, exp.endDate);
    }, 0);

  const handleHRFilterChange = (
    field: keyof typeof hrFilters,
    value: string,
  ) => {
    setHrFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const hasHRFilters = useMemo(
    () =>
      Object.values(hrFilters).some(
        (value) => value && value.trim().length > 0,
      ),
    [hrFilters],
  );

  const evaluation = useMemo<{ fits: EvaluatedResume[]; needsReview: EvaluatedResume[] }>(() => {
    if (!hasHRFilters) {
      return { fits: [], needsReview: [] };
    }

    const requiredSkills = parseList(hrFilters.mandatorySkills).map((skill) =>
      skill.toLowerCase(),
    );
    const optionalSkills = parseList(hrFilters.optionalSkills).map((skill) =>
      skill.toLowerCase(),
    );
    const minExperience = parseFloat(hrFilters.minExperience);
    const minYears = Number.isNaN(minExperience) ? 0 : minExperience;
    const requiredEducation = hrFilters.requiredEducation
      .trim()
      .toLowerCase();

    const fits: EvaluatedResume[] = [];
    const needsReview: EvaluatedResume[] = [];

    resumes.forEach((resume) => {
      const parsed = resume.parsedData || {};
      const resumeSkills = (parsed.skills || []).map((skill) =>
        skill.toLowerCase(),
      );
      const reasons: string[] = [];

      requiredSkills.forEach((skill) => {
        if (!resumeSkills.some((rs) => rs.includes(skill))) {
          reasons.push(`Missing required skill: ${skill}`);
        }
      });

      const optionalSkillMatches = optionalSkills.filter((skill) =>
        resumeSkills.some((rs) => rs.includes(skill)),
      );

      const totalExperienceYears = Number(
        getTotalExperienceYears(parsed.experience || []).toFixed(2),
      );
      if (minYears && totalExperienceYears < minYears) {
        reasons.push(
          `Requires at least ${minYears} yrs experience (has ${totalExperienceYears.toFixed(
            1,
          )})`,
        );
      }

      if (requiredEducation) {
        const hasEducation = (parsed.education || []).some((edu: any) =>
          `${edu.degree || ''} ${edu.institution || ''}`
            .toLowerCase()
            .includes(requiredEducation),
        );
        if (!hasEducation) {
          reasons.push(
            `Missing education requirement: ${hrFilters.requiredEducation}`,
          );
        }
      }

      const entry: EvaluatedResume = {
        resume,
        totalExperienceYears,
        optionalSkillMatches,
        reasons,
      };

      if (reasons.length === 0) {
        fits.push(entry);
      } else {
        needsReview.push(entry);
      }
    });

    return { fits, needsReview };
  }, [resumes, hrFilters, hasHRFilters]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await resumeApi.getAll(page, 10, search || undefined, skillFilter || undefined);
      setResumes(response.data);
      setTotal(response.total);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch resumes';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [page, search, skillFilter]);

  const onDrop = async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;

    setUploading(true);
    try {
      await resumeApi.upload(acceptedFiles);
      showToast(
        `Uploaded ${acceptedFiles.length} resume${acceptedFiles.length > 1 ? 's' : ''} successfully!`,
        'success',
      );
      fetchResumes();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Upload failed';
      showToast(message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
    maxFiles: 20,
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeApi.delete(id);
      showToast('Resume deleted successfully', 'success');
      fetchResumes();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete resume';
      showToast(message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Resume Dashboard</h1>

        {/* Upload Section */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          } ${uploading ? 'opacity-50' : ''} bg-white dark:bg-gray-800`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <p className="text-gray-600 dark:text-gray-300">Uploading...</p>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {isDragActive
                  ? 'Drop the files here'
                  : 'Drag & drop one or more resumes (PDF) here, or click to select'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Only PDF files are supported. You can upload up to 20 at a time.
              </p>
            </>
          )}
        </div>

        {/* Search and Filter */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search resumes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
          />
          <input
            type="text"
            placeholder="Filter by skill..."
            value={skillFilter}
            onChange={(e) => {
              setSkillFilter(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
          />
        </div>

        {/* HR Requirement Filters */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">HR Requirement Filters</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Leave fields blank to ignore that criteria.</p>
            </div>
            {hasHRFilters && (
              <button
                onClick={() =>
                  setHrFilters({
                    mandatorySkills: '',
                    optionalSkills: '',
                    minExperience: '',
                    requiredEducation: '',
                  })
                }
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mandatory Skills (comma-separated)
              </label>
              <input
                type="text"
                value={hrFilters.mandatorySkills}
                onChange={(e) => handleHRFilterChange('mandatorySkills', e.target.value)}
                placeholder="e.g., React, Node.js, SQL"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Optional Skills (comma-separated)
              </label>
              <input
                type="text"
                value={hrFilters.optionalSkills}
                onChange={(e) => handleHRFilterChange('optionalSkills', e.target.value)}
                placeholder="e.g., AWS, Docker, GraphQL"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Years of Experience
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={hrFilters.minExperience}
                onChange={(e) => handleHRFilterChange('minExperience', e.target.value)}
                placeholder="e.g., 3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Required Education
              </label>
              <input
                type="text"
                value={hrFilters.requiredEducation}
                onChange={(e) => handleHRFilterChange('requiredEducation', e.target.value)}
                placeholder="e.g., Bachelor's in Computer Science"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {hasHRFilters && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Fits the Role ({evaluation.fits.length})
              </h3>
              {evaluation.fits.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No resumes currently meet all the specified requirements.
                </p>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {evaluation.fits.map(({ resume, totalExperienceYears, optionalSkillMatches }) => (
                    <div
                      key={resume.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-blue-400 dark:hover:border-blue-400 transition"
                      onClick={() => navigate(`/resume/${resume.id}`)}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">
                            {resume.parsedData?.name || resume.fileName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {totalExperienceYears.toFixed(1)} yrs total experience
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {optionalSkillMatches.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {optionalSkillMatches.map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Needs Attention ({evaluation.needsReview.length})
              </h3>
              {evaluation.needsReview.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No resumes are missing the specified requirements.
                </p>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {evaluation.needsReview.map(({ resume, reasons, totalExperienceYears, optionalSkillMatches }) => (
                    <div
                      key={resume.id}
                      className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">
                            {resume.parsedData?.name || resume.fileName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {totalExperienceYears.toFixed(1)} yrs total experience
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/resume/${resume.id}`)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View
                        </button>
                      </div>
                      <ul className="mt-3 space-y-1 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                        {reasons.map((reason: string, idx: number) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                      {optionalSkillMatches.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {optionalSkillMatches.map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resumes List */}
        <div className="mt-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-colors">
              <p className="text-gray-600 dark:text-gray-400">No resumes found. Upload one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700"
                  onClick={() => navigate(`/resume/${resume.id}`)}
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {resume.parsedData?.name || resume.fileName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{resume.fileName}</p>
                    {resume.parsedData?.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">{resume.parsedData.email}</p>
                    )}
                    {resume.parsedData?.skills && resume.parsedData.skills.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {resume.parsedData.skills.slice(0, 5).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {resume.parsedData.skills.length > 5 && (
                            <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                              +{resume.parsedData.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {resume.parsedData?.experience && resume.parsedData.experience.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Latest Experience
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {resume.parsedData.experience[0].title}{' '}
                          {resume.parsedData.experience[0].company && (
                            <>@ {resume.parsedData.experience[0].company}</>
                          )}
                        </p>
                      </div>
                    )}
                    {resume.parsedData?.education && resume.parsedData.education.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Education
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {resume.parsedData.education[0].degree}{' '}
                          {resume.parsedData.education[0].institution && (
                            <>@ {resume.parsedData.education[0].institution}</>
                          )}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(resume.id);
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 10 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                Page {page} of {Math.ceil(total / 10)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 10)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

