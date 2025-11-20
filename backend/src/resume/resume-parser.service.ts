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

  async extractTextFromFile(filePath: string, fileType: string): Promise<string> {
    try {
      if (fileType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
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
    ]
  }
  
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
        return JSON.parse(jsonText);
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
    
    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];

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
    };
  }
}

