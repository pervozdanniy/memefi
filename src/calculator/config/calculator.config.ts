import { availableParallelism } from 'node:os';
import * as process from 'node:process';

export interface CalculatorConfig {
  threadsNum: number;
}

export default () => ({
  threadsNum:
    parseInt(process.env.CALCULATOR_THREAD_NUM, 10) || availableParallelism(),
});
