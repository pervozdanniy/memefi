import { Module } from '@nestjs/common';
import { CalculatorController } from './calculator.controller';
import { CalculatorService } from './calculator.service';
import { ConfigModule } from '@nestjs/config';
import config from './config/calculator.config';

@Module({
  imports: [ConfigModule.forFeature(config)],
  controllers: [CalculatorController],
  providers: [CalculatorService],
})
export class CalculatorModule {}
