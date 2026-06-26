'use client';

import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  GitBranch,
  BookOpen,
  Code2,
  TrendingUp,
  Zap,
  FileText,
  Clock,
} from 'lucide-react';
import Header from '@/components/header';
import MaintainerBriefing from '@/components/maintainer-briefing';
import TodaysPriorities from '@/components/todays-priorities';
import ReleaseAssistant from '@/components/release-assistant';
import DocumentationDrift from '@/components/documentation-drift';
import ContributorOpportunities from '@/components/contributor-opportunities';
import RepositoryHealth from '@/components/repository-health';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />

      <main className="w-full max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <MaintainerBriefing />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <TodaysPriorities />
            <ReleaseAssistant />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <RepositoryHealth />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DocumentationDrift />
          <ContributorOpportunities />
        </div>
      </main>
    </div>
  );
}
