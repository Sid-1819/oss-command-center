"use server";

import { signIn, signOut } from "@/auth";
import { APP_PATH } from "@/lib/auth";

function resolveCallbackUrl(callbackUrl?: string): string {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return APP_PATH;
  }

  return callbackUrl;
}

export async function signInWithGitHub(callbackUrl?: string) {
  await signIn("github", { redirectTo: resolveCallbackUrl(callbackUrl) });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/landing" });
}
