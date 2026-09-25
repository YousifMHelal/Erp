import { buildOfflineSnapshot } from "@/lib/offline-snapshot.server";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Offline snapshot for the device. A plain GET route rather than a server action: Next.js runs
 * server actions one at a time per client, so a background refresh as an action could delay a save.
 */
export async function GET(): Promise<Response> {
  try {
    const snapshot = await buildOfflineSnapshot();
    if (!snapshot) return new Response(null, { status: 401 });
    return Response.json(snapshot, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    logError("Offline snapshot failed", error);
    return new Response(null, { status: 500 });
  }
}
