import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PollutionService } from './pollution.service.js';

class SubmitReadingDto {
  location: string;
  pm25: number;
  source: string;
}

@Controller('pollution')
export class PollutionController {
  constructor(private readonly pollutionService: PollutionService) {}

  @Get('readings')
  async getReadings() {
    return this.pollutionService.getReadings();
  }

  @Get('reports')
  async getReports() {
    return this.pollutionService.getReports();
  }

  @Post('readings')
  async submitReading(@Body() dto: SubmitReadingDto) {
    return this.pollutionService.submitReading(
      dto.location,
      dto.pm25,
      dto.source,
    );
  }

  @Get('ingest/:city')
  async ingest(@Param('city') city: string) {
    return this.pollutionService.ingestFromOpenAQ(city);
  }
}