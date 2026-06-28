import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { authorizeDevToken, isDevTokenLoginAvailable } from "@/lib/auth/dev-credentials";

const providers: NonNullable<NextAuthConfig["providers"]> = [
  GitHub({
    clientId: process.env.AUTH_GITHUB_ID,
    clientSecret: process.env.AUTH_GITHUB_SECRET,
    authorization: {
      params: {
        scope: "read:user repo",
      },
    },
  }),
];

if (isDevTokenLoginAvailable()) {
  providers.push(
    Credentials({
      id: "dev-token",
      name: "Dev Token",
      credentials: {},
      authorize: authorizeDevToken,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  callbacks: {
    jwt({ token, account, profile, user }) {
      if (user) {
        token.sub = user.id;

        if ("username" in user && typeof user.username === "string") {
          token.username = user.username;
        }

        if ("accessToken" in user && typeof user.accessToken === "string") {
          token.accessToken = user.accessToken;
        }
      }

      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      if (profile && "login" in profile && typeof profile.login === "string") {
        token.username = profile.login;
      }

      if (account?.provider === "dev-token") {
        token.authProvider = "dev-token";
      } else if (account?.provider === "github") {
        token.authProvider = "github";
      }

      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }

      if (typeof token.username === "string") {
        session.user.username = token.username;
      }

      if (typeof token.accessToken === "string") {
        session.accessToken = token.accessToken;
      }

      session.authProvider =
        token.authProvider === "dev-token" ? "dev-token" : "github";

      return session;
    },
  },
});
