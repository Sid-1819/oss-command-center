"use server";

import { signIn, signOut } from "@/auth";
import { APP_PATH } from "@/lib/auth";
import { isDevTokenLoginAvailable } from "@/lib/auth/dev-credentials";

function resolveCallbackUrl(callbackUrl?: string): string {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return APP_PATH;
  }

  return callbackUrl;
}

export async function signInWithGitHub(callbackUrl?: string) {
  await signIn("github", { redirectTo: resolveCallbackUrl(callbackUrl) });
}

export async function signInWithDevToken(callbackUrl?: string) {
  if (!isDevTokenLoginAvailable()) {
    throw new Error("Dev token login is only available in development.");
  }

  await signIn("dev-token", { redirectTo: resolveCallbackUrl(callbackUrl) });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/landing" });
}
