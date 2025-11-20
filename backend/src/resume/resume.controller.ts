import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResumeService } from './resume.service';

@ApiTags('resumes')
@Controller('resumes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Unsupported file type. Please upload a PDF.',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload resume files (PDF only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Resume files (PDF only, max 10MB each)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Resumes successfully uploaded and parsed',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fileName: { type: 'string' },
          filePath: { type: 'string' },
          fileType: { type: 'string' },
          parsedData: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              experience: { type: 'array' },
              education: { type: 'array' },
              projects: { type: 'array' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or no file uploaded' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async uploadFile(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    try {
      const uploads = await Promise.all(
        files.map((file) => this.resumeService.create(file, req.user.userId)),
      );
      return uploads;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.message && error.message.includes('Unsupported file type')) {
        throw new BadRequestException(
          'Unsupported file type. Please upload a PDF.',
        );
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all resumes with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term to filter resumes' })
  @ApiQuery({ name: 'skill', required: false, type: String, description: 'Filter by skill name' })
  @ApiResponse({
    status: 200,
    description: 'List of resumes retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fileName: { type: 'string' },
              parsedData: { type: 'object' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('skill') skill?: string,
  ) {
    return this.resumeService.findAll(
      req.user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      skill,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get resume statistics and skill frequency' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalResumes: { type: 'number' },
        skillFrequency: {
          type: 'object',
          additionalProperties: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async getStats(@Request() req) {
    return this.resumeService.getStats(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific resume by ID' })
  @ApiParam({ name: 'id', description: 'Resume UUID' })
  @ApiResponse({
    status: 200,
    description: 'Resume retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        fileName: { type: 'string' },
        parsedData: { type: 'object' },
        rawText: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.resumeService.findOne(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resume by ID' })
  @ApiParam({ name: 'id', description: 'Resume UUID' })
  @ApiResponse({
    status: 200,
    description: 'Resume deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Resume deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.resumeService.remove(id, req.user.userId);
    return { message: 'Resume deleted successfully' };
  }
}

