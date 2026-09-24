/**
 * Structured error logging seam. Emits one JSON line per call so log output stays
 * greppable/parseable in production, and gives every Server Action a single place
 * to route to a real sink (Sentry, Logtail, etc.) later without touching call sites.
 */
export function logError(context: string, error: unknown) {
  console.error(
    JSON.stringify({
      level: "error",
      time: new Date().toISOString(),
      context,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }),
  );
}
