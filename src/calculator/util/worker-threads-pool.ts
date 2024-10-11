import { EventEmitterAsyncResource } from 'node:events';
import { Worker } from 'node:worker_threads';

const kTaskInfo = Symbol('kTaskInfo');
const kWorkerFreedEvent = Symbol('kWorkerFreedEvent');

type Callback<TRes = any> = (err: unknown | null, result: TRes | null) => void;

type PoolWorker = Worker & { [kTaskInfo]?: Callback };

export interface WorkerThreadsPool {
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: 'workerStarted', listener: () => void): this;
  on(event: 'workerStopped', listener: () => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
}

export class WorkerThreadsPool<
  TData = any,
  TRes = any,
> extends EventEmitterAsyncResource {
  private readonly workers: PoolWorker[] = [];
  private readonly freeWorkers: PoolWorker[] = [];
  private readonly tasks: { payload: TData; callback: Callback }[] = [];

  constructor(
    private readonly numThreads: number,
    private readonly workerFactory: () => PoolWorker,
  ) {
    super({ name: 'WorkerPool' });

    for (let i = 0; i < this.numThreads; i++) {
      this.addNewWorker();
    }

    this.on(kWorkerFreedEvent, () => {
      if (this.tasks.length > 0) {
        const { payload, callback } = this.tasks.shift();
        this.runTask(payload, callback);
      }
    });
  }

  public run(task: TData): Promise<TRes> {
    let resolve: (value: TRes) => void, reject: (reason?: any) => void;
    const pr = new Promise<TRes>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const callback = (err: unknown | null, res?: TRes) => {
      if (err !== null) {
        return reject(err);
      }
      return resolve(res);
    };

    this.runTask(task, callback);

    return pr;
  }

  public async close() {
    await Promise.all(this.workers.map((w) => w.terminate()));
    this.emitDestroy();
  }

  private addNewWorker() {
    const worker = this.workerFactory();
    worker
      .on('online', () => this.emit('workerStarted'))
      .on('exit', () => this.emit('workerStopped'))
      .on('message', (result) => {
        worker[kTaskInfo](null, result);
        worker[kTaskInfo] = null;
        this.freeWorkers.push(worker);
        this.emit(kWorkerFreedEvent);
      })
      .on('error', (err) => {
        if (worker[kTaskInfo]) {
          worker[kTaskInfo](err, null);
        } else {
          this.emit('error', err);
        }

        this.workers.splice(this.workers.indexOf(worker), 1);
        this.addNewWorker();
      });
    this.workers.push(worker);
    this.freeWorkers.push(worker);
    this.emit(kWorkerFreedEvent);
  }

  private runTask(task: TData, callback: Callback<TRes>) {
    if (this.freeWorkers.length === 0) {
      this.tasks.push({ payload: task, callback });
    }

    const worker = this.freeWorkers.pop();
    worker[kTaskInfo] = callback;
    worker.postMessage(task);
  }
}
