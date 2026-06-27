import Link from 'next/link';
import { GitBranch } from 'lucide-react';
import { getLoginUrl } from '@/lib/auth';

export default function Navigation() {
  const loginUrl = getLoginUrl();
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white">
            <GitBranch className="w-4 h-4" />
          </div>
          <span className="font-heading font-bold text-lg group-hover:text-primary transition-colors">MaintainerOS</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#philosophy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Philosophy</a>
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href={loginUrl}
            className="hidden sm:inline-block px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Developer login
          </Link>
          <Link
            href={`${loginUrl}&provider=github`}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
}
