"use client";

import { Check, Sparkles } from "lucide-react";
import RepositoryPicker from "@/components/repository-picker";
import RecentRepositories from "@/components/recent-repositories";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ClientSessionUser } from "@/lib/auth";
import type { RecentRepo } from "@/lib/recent-repositories";

const CAPABILITIES = [
  "Prioritize Issues",
  "Generate Documentation PRs",
  "Fix Low-effort Bugs",
  "Review Merge Queue",
  "Release Assistant",
] as const;

interface DashboardHomeProps {
  user: ClientSessionUser;
  repositoryRef: string;
  onRepositoryRefChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  canAnalyze: boolean;
  recentRepos: RecentRepo[];
  onSelectRecent: (repositoryRef: string) => void;
  demoMode?: boolean;
}

function getGreetingName(user: ClientSessionUser): string {
  const firstName = user.name?.trim().split(/\s+/)[0];

  if (firstName) {
    return firstName;
  }

  return `@${user.username}`;
}

export default function DashboardHome({
  user,
  repositoryRef,
  onRepositoryRefChange,
  onAnalyze,
  isAnalyzing,
  canAnalyze,
  recentRepos,
  onSelectRecent,
  demoMode = false,
}: DashboardHomeProps) {
  const trimmedRef = repositoryRef.trim();
  const isReady = trimmedRef.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 py-16 md:py-24">
      <div className="w-full max-w-md text-center">
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome, {getGreetingName(user)}
        </p>
        <p className="mt-2 text-muted-foreground">
          What would you like to maintain today?
        </p>
      </div>

      <div className="glass-panel mt-10 w-full max-w-md space-y-4 p-6">
        <RepositoryPicker
          value={repositoryRef}
          onSelect={onRepositoryRefChange}
          disabled={isAnalyzing || demoMode}
          allowAnyRepository={user.canAnalyzeAnyRepository}
        />

        {isReady ? (
          <p className="text-center text-xs text-muted-foreground">
            Ready to analyze{" "}
            <span className="font-mono text-foreground">{trimmedRef}</span>
          </p>
        ) : null}

        <Button
          size="lg"
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="w-full gap-2 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
        >
          {isAnalyzing ? (
            <>
              <Spinner className="size-4" />
              Analyzing…
            </>
          ) : (
            <>
              <Sparkles className="size-4" data-icon="inline-start" />
              {demoMode ? "Load demo" : "Analyze Repository"}
            </>
          )}
        </Button>
      </div>

      {recentRepos.length > 0 ? (
        <>
          <div className="my-10 w-full max-w-md border-t border-white/[0.06]" />
          <RecentRepositories
            recentRepos={recentRepos}
            selectedRepositoryRef={repositoryRef}
            onSelectRecent={onSelectRecent}
          />
        </>
      ) : null}

      <div className="my-10 w-full max-w-md border-t border-white/[0.06]" />

      <section className="w-full max-w-md">
        <h2 className="mb-4 text-sm font-medium text-foreground">
          What MaintainerOS can do
        </h2>
        <ul className="space-y-2.5">
          {CAPABILITIES.map((capability) => (
            <li
              key={capability}
              className="flex items-center gap-2.5 text-sm text-muted-foreground"
            >
              <Check className="size-4 shrink-0 text-primary" />
              {capability}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
