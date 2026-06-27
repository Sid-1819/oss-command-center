"use server";

import { getUserRepositories as fetchUserRepositories } from "@/lib/github/user";
import { AuthError, requireSession } from "@/lib/auth";
import {
  GitHubUserError,
  type GitHubUserErrorCode,
  type UserRepository,
} from "@/types/github-user";

export type GetUserRepositoriesResult =
  | {
      success: true;
      repositories: UserRepository[];
    }
  | {
      success: false;
      error: {
        code: GitHubUserErrorCode | "EXPIRED_SESSION";
        message: string;
      };
    };

export async function getUserRepositoriesAction(): Promise<GetUserRepositoriesResult> {
  try {
    const session = await requireSession();
    const repositories = await fetchUserRepositories(session.accessToken);

    return {
      success: true,
      repositories,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: {
          code: "EXPIRED_SESSION",
          message: error.message,
        },
      };
    }

    if (error instanceof GitHubUserError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "UNKNOWN",
        message: "Failed to load repositories.",
      },
    };
  }
}
