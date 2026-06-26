'use client';

import Header from '@/components/header';
import MaintainerBriefing from '@/components/maintainer-briefing';
import TodaysPriorities from '@/components/todays-priorities';
import ReleaseAssistant from '@/components/release-assistant';
import DocumentationDrift from '@/components/documentation-drift';
import ContributorOpportunities from '@/components/contributor-opportunities';
import RepositoryHealth from '@/components/repository-health';

export default function Home() {
  return (
    <div className="min-h-screen text-foreground">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <MaintainerBriefing />
        </section>

        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <TodaysPriorities />
            <ReleaseAssistant />
          </div>

          <div className="space-y-5">
            <RepositoryHealth />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <DocumentationDrift />
          <ContributorOpportunities />
        </div>
      </main>
    </div>
  );
}
