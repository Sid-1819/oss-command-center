import type { Session } from "next-auth";
import { auth } from "@/auth";

export const APP_PATH = "/app";
export const LOGIN_PATH = "/login";

export function getLoginUrl(callbackUrl: string = APP_PATH): string {
  return `${LOGIN_PATH}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export class AuthError extends Error {
  readonly code: "EXPIRED_SESSION";

  constructor(message = "Session expired. Sign in again.") {
    super(message);
    this.name = "AuthError";
    this.code = "EXPIRED_SESSION";
  }
}

export interface ClientSessionUser {
  id: string;
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
  username: string;
}

export async function getSession() {
  return auth();
}

export async function getGitHubAccessToken(): Promise<string | undefined> {
  const session = await auth();

  if (session?.accessToken) {
    return session.accessToken;
  }

  if (
    process.env.NODE_ENV === "development" &&
    process.env.GITHUB_TOKEN?.trim()
  ) {
    return process.env.GITHUB_TOKEN.trim();
  }

  return undefined;
}

export async function requireSession() {
  const session = await auth();

  if (!session?.user?.id || !session.accessToken) {
    throw new AuthError();
  }

  return session;
}

export function toClientSession(session: Session | null): ClientSessionUser | null {
  if (!session?.user?.id || !session.user.username) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    username: session.user.username,
  };
}
