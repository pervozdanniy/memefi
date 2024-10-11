import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import { EvaluateRequestDto } from './dto/evaluate.request.dto';

@Controller('/')
export class CalculatorController {
  constructor(private readonly appService: CalculatorService) {}

  @Post('/evaluate')
  @HttpCode(HttpStatus.OK)
  evaluate(@Body() { expression }: EvaluateRequestDto) {
    return this.appService.evaluate(expression);
  }
}
