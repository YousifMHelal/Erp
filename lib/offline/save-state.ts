/**
 * Server Actions share the App Router's single action queue, so a background snapshot fetch
 * started mid-save would delay the save's reply. Saves mark themselves here and the
 * background refresh skips its turn while one is running.
 */
let inFlight = 0;

export function isSaveInFlight(): boolean {
  return inFlight > 0;
}

export async function trackSave<T>(work: () => Promise<T>): Promise<T> {
  inFlight += 1;
  try {
    return await work();
  } finally {
    inFlight -= 1;
  }
}
