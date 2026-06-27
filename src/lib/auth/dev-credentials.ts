import { Octokit } from "octokit";

export interface DevAuthUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string;
  accessToken: string;
}

export function isDevTokenLoginAvailable(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    Boolean(process.env.GITHUB_TOKEN?.trim())
  );
}

export async function authorizeDevToken(): Promise<DevAuthUser | null> {
  if (!isDevTokenLoginAvailable()) {
    return null;
  }

  const accessToken = process.env.GITHUB_TOKEN!.trim();

  try {
    const octokit = new Octokit({ auth: accessToken });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    return {
      id: String(user.id),
      name: user.name ?? user.login,
      email: user.email ?? null,
      image: user.avatar_url,
      username: user.login,
      accessToken,
    };
  } catch {
    return null;
  }
}
