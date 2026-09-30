export interface ParsedExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string | 'Present';
  description?: string;
}

export interface ParsedEducation {
  degree: string;
  institution: string;
  year?: string;
}

export interface ParsedProject {
  name: string;
  description?: string;
  technologies?: string[];
}

export interface ParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: ParsedExperience[];
  education?: ParsedEducation[];
  projects?: ParsedProject[];
  links?: Array<{
    url: string;
    type: string;
  }>;
}

