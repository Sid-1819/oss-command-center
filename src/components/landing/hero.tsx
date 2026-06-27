import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getLoginUrl } from '@/lib/auth';

export default function Hero() {
  const loginUrl = getLoginUrl();
  return (
    <section className="relative min-h-screen pt-32 pb-20 px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -right-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-accent-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/5 border border-accent-primary/30 text-sm text-accent-primary">
          <Sparkles className="w-3.5 h-3.5" />
          Introducing MaintainerOS
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-balance">
          <span className="bg-gradient-to-r from-accent-primary via-accent-primary to-accent-secondary bg-clip-text text-transparent">
            Your operating system
          </span>
          <br />
          for open source
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto text-balance">
          An AI-powered workspace designed for maintainers who believe in intentional workflows over metrics-driven analytics. Take back control of your repositories.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href={loginUrl} className="inline-flex items-center justify-center px-6 py-3 bg-accent-primary text-black font-semibold rounded-lg hover:bg-accent-primary/90 transition-all hover:gap-2 group">
            Start free
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
          </Link>
          <button className="inline-flex items-center justify-center px-6 py-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-foreground font-semibold">
            Watch demo
          </button>
        </div>

        {/* Stats bar */}
        <div className="glass-panel p-6 max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-accent-primary">500+</div>
              <div className="text-sm text-muted-foreground">Active maintainers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent-secondary">10k+</div>
              <div className="text-sm text-muted-foreground">Repositories managed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent-primary">50%</div>
              <div className="text-sm text-muted-foreground">Time saved on triage</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
