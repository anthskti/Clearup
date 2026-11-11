import { AsyncLocalStorage } from "node:async_hooks";

type Attempt = { jobId: number; attemptId: string };
const current = new AsyncLocalStorage<Attempt>();

export function runWithImportAttempt<T>(attempt: Attempt, work: () => Promise<T>): Promise<T> {
  return current.run(attempt, work);
}

export function getCurrentImportAttempt(): Attempt | undefined {
  return current.getStore();
}
