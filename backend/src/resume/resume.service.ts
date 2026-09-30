import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ResumeParserService } from './resume-parser.service';
import { ParsedResumeData } from '../types/parsed-resume.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ResumeService {
  constructor(
    private prisma: PrismaService,
    private resumeParserService: ResumeParserService,
  ) {}

  async create(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Create uploads dir if not exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Sanitize filename to prevent path traversal attacks
    const sanitizedOriginalName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.\./g, '_')
      .substring(0, 255); // Limit filename length

    // Save file to disk
    const fileName = `${Date.now()}-${sanitizedOriginalName}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

<<<<<<< HEAD
    // Extract text
    let rawText = await this.resumeParserService.extractTextFromFile(
      filePath,
=======
    // Extract text from PDF buffer (sanitized)
    const rawText = await this.resumeParserService.extractTextFromBuffer(
      file.buffer,
>>>>>>> 64f38024857cbe148b86a32267b614e1d5600583
      file.mimetype,
    );
    const cleanRawText = rawText || '';

<<<<<<< HEAD
    // FIX: remove null bytes that break PostgreSQL
    rawText = rawText.replace(/\u0000/g, '');
=======
    // Parse with AI
    const parsedData = await this.resumeParserService.parseResumeWithAI(
      cleanRawText,
    );
    const safeParsedData = JSON.parse(JSON.stringify(parsedData || {}));
>>>>>>> 64f38024857cbe148b86a32267b614e1d5600583

    // AI parsing
    const parsedData =
      await this.resumeParserService.parseResumeWithAI(rawText);

    // Save to DB
    return this.prisma.resume.create({
      data: {
        fileName: sanitizedOriginalName,
        filePath,
        fileType: file.mimetype,
<<<<<<< HEAD
        rawText,
        parsedData: parsedData as unknown as Prisma.JsonValue,
=======
        rawText: cleanRawText,
        parsedData: safeParsedData as any,
>>>>>>> 64f38024857cbe148b86a32267b614e1d5600583
        userId,
      },
    });
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    skill?: string,
  ) {
    const where: any = { userId };

    if (search) {
      where.rawText = { contains: search, mode: 'insensitive' };
    }

    // If skill filter is provided, we need to filter in memory for accurate results
    // since Prisma's JSONB filtering has limitations with case-insensitive array searches
    if (skill) {
      // First, get all resumes matching the base criteria
      const allResumes = await this.prisma.resume.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      // Filter by skill (case-insensitive)
      const skillLower = skill.toLowerCase();
      const filteredResumes = allResumes.filter((resume) => {
        const parsedData = resume.parsedData as ParsedResumeData | null;
        const skills = parsedData?.skills || [];
        return skills.some((s: string) =>
          s.toLowerCase().includes(skillLower),
        );
      });

      // Apply pagination after filtering
      const skip = (page - 1) * limit;
      const paginatedData = filteredResumes.slice(skip, skip + limit);

      return {
        data: paginatedData,
        total: filteredResumes.length,
        page,
        limit,
      };
    }

    // No skill filter - use standard pagination
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.resume.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, userId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return resume;
  }

  async remove(id: string, userId: string): Promise<void> {
    const resume = await this.findOne(id, userId);

    // Delete file
    if (fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
    }

    await this.prisma.resume.delete({
      where: { id },
    });
  }

  async getStats(userId: string) {
    const resumes = await this.prisma.resume.findMany({
      where: { userId },
    });

    const skillFrequency: Record<string, number> = {};
    resumes.forEach((resume) => {
      const parsedData = resume.parsedData as ParsedResumeData | null;
      const skills = parsedData?.skills || [];
      skills.forEach((skill: string) => {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
      });
    });

    return {
      totalResumes: resumes.length,
      skillFrequency,
    };
  }
}
