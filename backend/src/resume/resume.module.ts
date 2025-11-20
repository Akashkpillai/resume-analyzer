import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { ResumeParserService } from './resume-parser.service';

@Module({
  controllers: [ResumeController],
  providers: [ResumeService, ResumeParserService],
})
export class ResumeModule {}

