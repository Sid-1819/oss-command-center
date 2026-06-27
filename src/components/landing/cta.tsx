import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CTA() {
  return (
    <section className="relative py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative glass-panel p-8 md:p-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Ready to take back control?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            Join maintainers who are replacing metrics dashboards with intentional workflows. Start free, upgrade when you&apos;re ready.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/app" className="inline-flex items-center justify-center px-8 py-3 bg-accent-primary text-black font-semibold rounded-lg hover:bg-accent-primary/90 transition-all hover:gap-2 group">
              Get started free
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
            </Link>
            <button className="px-8 py-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-foreground font-semibold">
              Schedule a demo
            </button>
          </div>

          {/* Footer text */}
          <p className="text-xs text-muted-foreground mt-8">
            No credit card required. Free tier includes up to 3 repositories. 14-day full access trial available.
          </p>
        </div>
      </div>
    </section>
  );
}
