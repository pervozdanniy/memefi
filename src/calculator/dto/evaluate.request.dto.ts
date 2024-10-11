import { IsNotEmpty, IsString } from 'class-validator';

export class EvaluateRequestDto {
  @IsNotEmpty()
  @IsString()
  // @Matches(/^[\d+\-*\/)(]+$/, {
  //   message: '$property must be valid math expression',
  // })
  expression: string;
}
