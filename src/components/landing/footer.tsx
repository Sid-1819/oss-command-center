import Link from 'next/link';
import { GitBranch, Mail, GitBranch as GithubIcon, Code } from 'lucide-react';

export default function Footer() {
  const footerLinks = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Blog', href: '/blog' },
    ],
  };


  return (
    <footer className="relative bg-secondary/30 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-linear-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center text-white">
                <GitBranch className="w-4 h-4" />
              </div>
              <span className="font-heading font-bold text-lg">MaintainerOS</span>
            </Link>
            <p className="text-xs text-muted-foreground">
              Intentional workflows for open source maintainers.
            </p>
          </div>



        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MaintainerOS. All rights reserved.
          </p>
        </div>
      </div>
      </div>
    </footer>

  );
}