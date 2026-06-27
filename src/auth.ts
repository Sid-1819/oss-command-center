import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user repo",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  callbacks: {
    jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      if (profile && "login" in profile && typeof profile.login === "string") {
        token.username = profile.login;
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

      return session;
    },
  },
});
