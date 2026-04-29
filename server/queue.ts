export interface QueueEntry<T> {
  data: T;
  resolvers: Array<(result: any) => void>;
  timestamp: number;
}

type QueueMap<T> = Map<string, QueueEntry<T>>;

class RequestQueue {
  private queues: Map<string, QueueMap<any>>;

  constructor() {
    this.queues = new Map();
  }

  enqueue<T>(type: string, data: T, resolver: (result: any) => void): void {
    if (!this.queues.has(type)) {
      this.queues.set(type, new Map());
    }

    const key = JSON.stringify(data);
    const queue = this.queues.get(type)!;

    if (!queue.has(key)) {
      queue.set(key, {
        data,
        resolvers: [resolver],
        timestamp: Date.now(),
      });
    } else {
      queue.get(key)!.resolvers.push(resolver);
    }
  }

  dequeue<T>(type: string): QueueEntry<T>[] {
    const queue = this.queues.get(type);

    if (!queue) return [];

    const batch = Array.from(queue.values()) as QueueEntry<T>[];
    queue.clear();

    return batch;
  }
}

export default new RequestQueue();
