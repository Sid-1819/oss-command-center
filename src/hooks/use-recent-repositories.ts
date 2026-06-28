"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadRecentRepos,
  recordRecentRepo,
  type RecentRepo,
} from "@/lib/recent-repositories";

export function useRecentRepositories(userId: string | undefined) {
  const [recentRepos, setRecentRepos] = useState<RecentRepo[]>([]);

  useEffect(() => {
    if (!userId) {
      setRecentRepos([]);
      return;
    }

    setRecentRepos(loadRecentRepos(userId));
  }, [userId]);

  const recordRecent = useCallback(
    (repositoryRef: string) => {
      if (!userId) {
        return;
      }

      setRecentRepos(recordRecentRepo(userId, repositoryRef));
    },
    [userId],
  );

  return { recentRepos, recordRecent };
}
