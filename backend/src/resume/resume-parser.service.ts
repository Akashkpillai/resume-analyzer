import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
const pdfParse = require('pdf-parse');
import Groq from 'groq-sdk';

@Injectable()
export class ResumeParserService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });
  }

  /**
   * Normalize URL to ensure it has a protocol (https:// or http://)
   */
  private normalizeUrl(url: string): string {
    if (!url) return url;
    
    // Remove any whitespace
    url = url.trim();
    
    // If URL already has protocol, return as is
    if (url.match(/^https?:\/\//i)) {
      return url;
    }
    
    // If URL starts with //, add https:
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    
    // Otherwise, add https:// prefix
    return `https://${url}`;
  }

  sanitizeText(text: string): string {
    if (!text) {
      return '';
    }
    return text.replace(/\u0000/g, '').replace(/\s+\n/g, '\n').trim();
  }

  async extractTextFromFile(filePath: string, fileType: string): Promise<string> {
    try {
      if (fileType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return this.sanitizeText(data.text || '');
      }
      throw new Error('Unsupported file type. Please upload a PDF.');
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('unsupported')) {
        throw new Error('Unsupported file type. Please upload a PDF.');
      }
      throw error;
    }
  }

  async extractTextFromBuffer(
    fileBuffer: Buffer,
    fileType: string,
  ): Promise<string> {
    try {
      if (fileType === 'application/pdf') {
        const data = await pdfParse(fileBuffer);
        return this.sanitizeText(data.text || '');
      }
      throw new Error('Unsupported file type. Please upload a PDF.');
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('unsupported')) {
        throw new Error('Unsupported file type. Please upload a PDF.');
      }
      throw error;
    }
  }

  async parseResumeWithAI(text: string): Promise<any> {
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ API key not set');
      return this.basicParse(text);
    }
  
    try {
      const prompt = `Extract structured information from this resume text. Return a JSON object with the following structure:
  {
    "name": "full name",
    "email": "email address",
    "phone": "phone number if available",
    "skills": ["skill1", "skill2", ...],
    "experience": [
      {
        "title": "job title",
        "company": "company name",
        "startDate": "start date",
        "endDate": "end date or 'Present'",
        "description": "job description"
      }
    ],
    "education": [
      {
        "degree": "degree name",
        "institution": "institution name",
        "year": "graduation year"
      }
    ],
    "projects": [
      {
        "name": "project name",
        "description": "project description",
        "technologies": ["tech1", "tech2"]
      }
    ],
    "links": [
      {
        "url": "full URL",
        "type": "LinkedIn/GitHub/Portfolio/Website/Behance/Dribbble/Medium/Blog/Other"
      }
    ]
  }
  
  IMPORTANT: Extract ALL URLs from the resume text. Classify each URL by type:
  - LinkedIn: linkedin.com URLs
  - GitHub: github.com URLs
  - Portfolio: portfolio, personal website, or project showcase URLs
  - Website: general website URLs
  - Behance: behance.net URLs
  - Dribbble: dribbble.com URLs
  - Medium: medium.com URLs
  - Blog: blog URLs
  - Other: any other URLs
  
  CRITICAL: All URLs in the "links" array MUST include the full protocol (https:// or http://).
  For example: "https://linkedin.com/in/username" NOT "linkedin.com/in/username"
  
  Resume text:
  ${text.substring(0, 4000)}`;
  
      const completion = await this.groq.chat.completions.create({
        model: "openai/gpt-oss-20b",   // Groq's main chat model
        messages: [
          {
            role: "system",
            content:
              "You are a resume parser. Extract structured information from resumes and return valid JSON only."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
      });
  
      const responseText = completion.choices[0].message.content || "{}";
  
      // Extract JSON if wrapped in ```json blocks
      const jsonMatch =
        responseText.match(/```json\n([\s\S]*?)\n```/) ||
        responseText.match(/```\n([\s\S]*?)\n```/) ||
        [null, responseText];
  
      const jsonText = jsonMatch[1] || responseText;
  
      try {
        const parsed = JSON.parse(jsonText);
        
        // Normalize all URLs in links array
        if (parsed.links && Array.isArray(parsed.links)) {
          parsed.links = parsed.links.map((link: any) => ({
            ...link,
            url: this.normalizeUrl(link.url || ''),
          })).filter((link: any) => link.url); // Remove empty URLs
        }
        
        return parsed;
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return this.basicParse(text);
      }
  
    } catch (error) {
      console.error("Groq AI parsing error, falling back to basic parse:", error);
      return this.basicParse(text);
    }
  }
  

  private basicParse(text: string): any {
    // Basic regex-based parsing as fallback
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    // Match URLs with protocol
    const urlRegexWithProtocol = /(https?:\/\/[^\s\)]+)/g;
    // Match URLs without protocol (common domains)
    const urlRegexWithoutProtocol = /(?:^|\s)((?:www\.)?(?:linkedin\.com|github\.com|behance\.net|dribbble\.com|medium\.com|twitter\.com|x\.com|youtube\.com|instagram\.com|facebook\.com|portfolio|[\w-]+\.(?:com|net|org|io|dev|me|co|edu|gov))[^\s\)]+)/gi;
    
    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];
    
    // Extract URLs with protocol
    const urlsWithProtocol = text.match(urlRegexWithProtocol) || [];
    
    // Extract URLs without protocol
    const urlsWithoutProtocol = text.match(urlRegexWithoutProtocol) || [];
    const normalizedUrlsWithoutProtocol = urlsWithoutProtocol.map(match => {
      // Remove leading whitespace and clean up
      return match.trim().replace(/^[:\/]+/, '');
    });

    // Combine and deduplicate URLs
    const allUrls = [...new Set([...urlsWithProtocol, ...normalizedUrlsWithoutProtocol])];

    // Extract and classify links
    const links = allUrls
      .map((url) => {
        // Normalize URL to ensure it has protocol
        const normalizedUrl = this.normalizeUrl(url);
        const urlLower = normalizedUrl.toLowerCase();
        let type = 'Website';
        
        if (urlLower.includes('linkedin.com')) {
          type = 'LinkedIn';
        } else if (urlLower.includes('github.com')) {
          type = 'GitHub';
        } else if (urlLower.includes('behance.net')) {
          type = 'Behance';
        } else if (urlLower.includes('dribbble.com')) {
          type = 'Dribbble';
        } else if (urlLower.includes('medium.com')) {
          type = 'Medium';
        } else if (urlLower.includes('portfolio') || urlLower.includes('personal') || urlLower.includes('website')) {
          type = 'Portfolio';
        } else if (urlLower.includes('blog')) {
          type = 'Blog';
        }
        
        return { url: normalizedUrl, type };
      })
      .filter((link) => link.url); // Remove empty URLs

    // Extract skills (common keywords)
    const skillKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'Node.js',
      'Angular', 'Vue', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker',
      'Kubernetes', 'Git', 'Linux', 'HTML', 'CSS', 'REST', 'GraphQL',
    ];
    const foundSkills = skillKeywords.filter((skill) =>
      text.toLowerCase().includes(skill.toLowerCase()),
    );

    return {
      email: emails[0] || '',
      phone: phones[0] || '',
      skills: foundSkills,
      experience: [],
      education: [],
      projects: [],
      links: links,
    };
  }
}

