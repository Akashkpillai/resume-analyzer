import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResumeParserService } from './resume-parser.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ResumeService {
  constructor(
    private prisma: PrismaService,
    private resumeParserService: ResumeParserService,
  ) {}

  async create(
    file: Express.Multer.File,
    userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save file
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    // Extract text
    const rawText = await this.resumeParserService.extractTextFromFile(
      filePath,
      file.mimetype,
    );

    // Parse with AI
    const parsedData = await this.resumeParserService.parseResumeWithAI(
      rawText,
    );

    // Save to database
    const resume = await this.prisma.resume.create({
      data: {
        fileName: file.originalname,
        filePath,
        fileType: file.mimetype,
        rawText,
        parsedData: parsedData as any,
        userId,
      },
    });

    return resume;
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    skill?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (search) {
      where.rawText = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.resume.count({ where }),
    ]);

    // Filter by skill if provided
    let filteredData = data;
    if (skill) {
      filteredData = data.filter((resume) => {
        const parsedData = resume.parsedData as any;
        const skills = parsedData?.skills || [];
        return skills.some((s: string) =>
          s.toLowerCase().includes(skill.toLowerCase()),
        );
      });
    }

    return {
      data: filteredData,
      total: skill ? filteredData.length : total,
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
      const parsedData = resume.parsedData as any;
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

