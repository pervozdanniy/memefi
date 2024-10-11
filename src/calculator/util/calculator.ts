type Operator = {
  priority: number;
  func: (x: string, y: string) => number;
};

export class Calculator {
  private operators = new Map<string, Operator>([
    ['+', { priority: 1, func: (x, y) => Number(x) + Number(y) }],
    ['-', { priority: 1, func: (x, y) => Number(x) - Number(y) }],
    ['/', { priority: 2, func: (x, y) => Number(x) / Number(y) }],
    ['*', { priority: 2, func: (x, y) => Number(x) * Number(y) }],
  ]);

  public evaluate(expression: string): number {
    const tokens = this.parse(expression);
    const rpn = this.shuntingYard(tokens);

    return this.evalRPN(rpn);
  }

  private parse(expression: string) {
    const stack: string[] = [];
    let currentNumber = '';

    for (let i = 0, l = expression.length; i < l; i++) {
      const c = expression.charAt(i);
      const lastToken = stack[stack.length - 1];
      const numberParsingStarted = currentNumber !== '';

      if (/\d/.test(c)) {
        currentNumber += c;
      } else if (this.operators.has(c) || c === '(' || c === ')') {
        if (
          this.operators.has(c) &&
          !numberParsingStarted &&
          this.operators.has(lastToken)
        ) {
          throw new Error(
            `Consecutive operators: "${lastToken}${c}" at pos: ${i + 1}`,
          );
        }
        if (numberParsingStarted) {
          stack.push(currentNumber);
        }
        stack.push(c);
        currentNumber = '';
      } else {
        throw new Error(`Invalid character: "${c}" at pos: ${i + 1}`);
      }
    }

    if (currentNumber !== '') {
      stack.push(currentNumber);
    }

    return stack;
  }

  private shuntingYard(tokens: string[]) {
    const operatorsStack: string[] = [];
    const output: string[] = [];

    for (const token of tokens) {
      if (this.operators.has(token)) {
        while (
          operatorsStack.length &&
          operatorsStack[operatorsStack.length - 1] !== undefined &&
          operatorsStack[operatorsStack.length - 1] !== '(' &&
          this.operators.get(operatorsStack[operatorsStack.length - 1])
            .priority >= this.operators.get(token).priority
        ) {
          output.push(operatorsStack.pop());
        }
        operatorsStack.push(token);
      } else if (token === '(') {
        operatorsStack.push(token);
      } else if (token === ')') {
        while (
          operatorsStack.length > 0 &&
          operatorsStack[operatorsStack.length - 1] !== '('
        ) {
          output.push(operatorsStack.pop());
        }
        if (
          operatorsStack.length > 0 &&
          operatorsStack[operatorsStack.length - 1] === '('
        ) {
          operatorsStack.pop();
        } else {
          throw new Error('Parentheses mismatch');
        }
      } else {
        output.push(token);
      }
    }

    while (operatorsStack.length > 0) {
      const operator = operatorsStack[operatorsStack.length - 1];
      if (operator === '(') {
        throw new Error('Parentheses mismatch');
      } else {
        output.push(operatorsStack.pop()!);
      }
    }

    return output;
  }

  private evalRPN(tokens: string[]) {
    const stack: string[] = [];

    for (const token of tokens) {
      const op = this.operators.get(token);

      if (op !== undefined) {
        const parameters: string[] = [];
        for (let i = 0; i < 2; i++) {
          parameters.push(stack.pop());
        }
        stack.push(
          op.func(...(parameters.reverse() as [string, string])).toString(),
        );
      } else {
        stack.push(token);
      }
    }

    if (stack.length > 1) {
      throw new Error('Insufficient operators');
    }

    return Number(stack[0]);
  }
}
