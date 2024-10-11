import { parentPort } from 'node:worker_threads';
import { Calculator } from './util/calculator';

export class CalculatorWorkerException extends Error {
  constructor(error: Error) {
    super(error.message);
    this.name = CalculatorWorkerException.name;
    this.stack = error.stack;
  }
}

const calculator = new Calculator();

function evaluate(expression: string) {
  try {
    return calculator.evaluate(expression);
  } catch (e) {
    throw new CalculatorWorkerException(e);
  }
}

parentPort?.on('message', (expression) => {
  const result = evaluate(expression);
  parentPort.postMessage(result);
});
