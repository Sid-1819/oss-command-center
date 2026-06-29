import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getLoginUrl } from '@/lib/auth';

export default function Hero() {
  const loginUrl = getLoginUrl();
  return (
    <section className="relative min-h-screen pt-32 pb-20 px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-white/5 border border-primary/30 text-sm text-primary font-medium">
          Introducing MaintainerOS
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight text-balance">
          The inbox OS
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            for repository maintainers
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto text-balance">
          AI-powered workspace for intentional maintenance workflows. Reduce noise, focus on what matters, ship with confidence.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
          <Link
            href={loginUrl}
            className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 group"
          >
            Continue with GitHub
            <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
          </Link>
        </div>

        {/* Features bar */}
        <div className="glass-panel p-8 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Setup required</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">∞</div>
              <div className="text-sm text-muted-foreground">Repositories</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">Instant</div>
              <div className="text-sm text-muted-foreground">GitHub sync</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
