type Task = () => Promise<void>;

/** Work nobody waits for (sending notifications). Errors are logged, never thrown. */
export class BackgroundTasks {
  private readonly running = new Set<Promise<void>>();

  run(task: Task): void {
    const promise = task()
      .catch((error) => console.error("[background]", error))
      .finally(() => this.running.delete(promise));
    this.running.add(promise);
  }

  /** Everything started so far has finished. */
  async idle(): Promise<void> {
    await Promise.all(this.running);
  }
}

/** Runs `work` over many items, a few at a time. */
export async function inBatches<T>(items: T[], size: number, work: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(work));
  }
}
