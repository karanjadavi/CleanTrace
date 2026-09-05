import { Test, TestingModule } from '@nestjs/testing';
import { PollutionController } from './pollution.controller.js';

describe('PollutionController', () => {
  let controller: PollutionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PollutionController],
    }).compile();

    controller = module.get<PollutionController>(PollutionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
