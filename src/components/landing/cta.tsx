import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getLoginUrl } from '@/lib/auth';

export default function CTA() {
  const loginUrl = getLoginUrl();
  return (
    <section className="relative py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative glass-panel p-8 md:p-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Ready to get started?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
            Connect your GitHub repositories and start your maintenance workflow in seconds. No configuration required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={loginUrl}
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20 group"
            >
              Continue with GitHub
              <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
            </Link>
            <button className="px-8 py-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-foreground font-semibold">
              View docs
            </button>
          </div>

          {/* Footer text */}
          <p className="text-xs text-muted-foreground mt-8">
            Free forever. No credit card required. Unlimited repositories on Pro plan.
          </p>
        </div>
      </div>
    </section>
  );
}
