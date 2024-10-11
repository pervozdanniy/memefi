import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { CalculatorWorkerException } from './calculator.worker';
import { ConfigService } from '@nestjs/config';
import { CalculatorConfig } from './config/calculator.config';
import { WorkerThreadsPool } from './util/worker-threads-pool';
import { Worker } from 'node:worker_threads';
import { join } from 'node:path';

@Injectable()
export class CalculatorService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(CalculatorService.name);

  private readonly threadsNum: number;

  private pool!: WorkerThreadsPool;

  constructor(config: ConfigService<CalculatorConfig>) {
    this.threadsNum = config.get('threadsNum');
  }

  public onApplicationBootstrap() {
    this.pool = new WorkerThreadsPool(
      this.threadsNum,
      () => new Worker(join(__dirname, 'calculator.worker')),
    );
    this.pool
      .on('workerStarted', () => this.logger.verbose('worker thread started'))
      .on('workerStopped', () => this.logger.verbose('worker thread stopped'))
      .on('error', (err) =>
        this.logger.error('worker thread failed', err.stack),
      );
  }

  public async onApplicationShutdown() {
    await this.pool.close();
  }

  public async evaluate(expression: string) {
    try {
      return await this.pool.run(expression);
    } catch (err) {
      if (err.name === CalculatorWorkerException.name) {
        throw new BadRequestException(`Invalid expression: ${err.message}`, {
          cause: err,
        });
      }
      this.logger.error('worker thread failed', err.stack);

      throw new InternalServerErrorException();
    }
  }
}
