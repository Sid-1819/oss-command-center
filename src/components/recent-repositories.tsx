"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRepoShortName, type RecentRepo } from "@/lib/recent-repositories";

interface RecentRepositoriesProps {
  recentRepos: RecentRepo[];
  selectedRepositoryRef: string;
  onSelectRecent: (repositoryRef: string) => void;
}

export default function RecentRepositories({
  recentRepos,
  selectedRepositoryRef,
  onSelectRecent,
}: RecentRepositoriesProps) {
  if (recentRepos.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-md">
      <h2 className="mb-3 text-sm font-medium text-foreground">Recently Opened</h2>
      <Tabs
        value={selectedRepositoryRef || undefined}
        onValueChange={onSelectRecent}
        className="w-full"
      >
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0"
        >
          {recentRepos.map((repo) => (
            <TabsTrigger
              key={repo.repositoryRef}
              value={repo.repositoryRef}
              title={repo.repositoryRef}
              className="shrink-0 rounded-lg border border-white/[0.08] bg-secondary/30 px-3 py-1.5 font-mono text-xs data-active:border-primary/30 data-active:bg-primary/10 data-active:text-primary"
            >
              {getRepoShortName(repo.repositoryRef)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </section>
  );
}
