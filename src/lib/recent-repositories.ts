"use client";

export const RECENT_REPOS_STORAGE_KEY_PREFIX = "maintaineros:recent-repos";
export const MAX_RECENT_REPOS = 8;

export type RecentRepo = {
  repositoryRef: string;
  lastOpenedAt: string;
};

function storageKey(userId: string): string {
  return `${RECENT_REPOS_STORAGE_KEY_PREFIX}:${userId}`;
}

export function loadRecentRepos(userId: string): RecentRepo[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(storageKey(userId));

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as RecentRepo[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (entry) =>
          typeof entry.repositoryRef === "string" &&
          entry.repositoryRef.trim().length > 0 &&
          typeof entry.lastOpenedAt === "string",
      )
      .slice(0, MAX_RECENT_REPOS);
  } catch {
    return [];
  }
}

export function recordRecentRepo(userId: string, repositoryRef: string): RecentRepo[] {
  const trimmedRef = repositoryRef.trim();

  if (typeof window === "undefined" || !trimmedRef) {
    return [];
  }

  const existing = loadRecentRepos(userId).filter(
    (entry) => entry.repositoryRef !== trimmedRef,
  );

  const next: RecentRepo[] = [
    { repositoryRef: trimmedRef, lastOpenedAt: new Date().toISOString() },
    ...existing,
  ].slice(0, MAX_RECENT_REPOS);

  localStorage.setItem(storageKey(userId), JSON.stringify(next));

  return next;
}

export function getRepoShortName(repositoryRef: string): string {
  const parts = repositoryRef.split("/");
  return parts[parts.length - 1] ?? repositoryRef;
}
