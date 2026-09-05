import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PollutionModule } from './pollution/pollution.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PollutionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}