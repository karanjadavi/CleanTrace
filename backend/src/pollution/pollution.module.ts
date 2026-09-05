import { Module } from '@nestjs/common';
import { PollutionService } from './pollution.service.js';
import { PollutionController } from './pollution.controller.js';

@Module({
  controllers: [PollutionController],
  providers: [PollutionService],
})
export class PollutionModule {}