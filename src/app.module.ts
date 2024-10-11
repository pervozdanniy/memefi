import { Module } from '@nestjs/common';
import { CalculatorModule } from './calculator/calculator.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), CalculatorModule],
})
export class AppModule {}
