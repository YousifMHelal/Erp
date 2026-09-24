import { config } from "dotenv";
import { vi } from "vitest";

config({ path: ".env" });

export const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

// Server Actions call revalidatePath/revalidateTag after their transaction commits.
// Outside a real Next.js request (as in these tests), that throws "static generation
// store missing" — the DB write already succeeded, so let the no-op stand in for it.
vi.mock("next/cache", () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}));
