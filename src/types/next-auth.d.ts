import type { DefaultSession } from "next-auth";

export type AuthProviderId = "github" | "dev-token";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
    } & DefaultSession["user"];
    accessToken: string;
    authProvider: AuthProviderId;
  }

  interface User {
    username?: string;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    username?: string;
    authProvider?: AuthProviderId;
  }
}

export {};
