"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { fail, ok } from "@/lib/action-result";
import { loginSchema } from "@/lib/validations";
import messages from "@/messages/ar.json";
import type { ActionResult } from "@/types";

const m = messages.authAction;

/**
 * Credentials sign-in. Returns an ActionResult instead of throwing so the login
 * form can render the Arabic error inline. On success NextAuth sets the session
 * cookie and the caller navigates.
 */
export async function signInWithCredentials(
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fail(m.invalid, parsed.error.flatten().fieldErrors);

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
    return ok(null);
  } catch (error) {
    // CredentialsSignin is the only expected failure — wrong password or an
    // inactive/unknown user. Everything else is unexpected and worth logging.
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") return fail(m.badCredentials);
      return fail(m.failed);
    }
    throw error;
  }
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
