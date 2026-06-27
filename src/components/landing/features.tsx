import { Zap, Filter, Users2, BookOpen, Bell, Code2 } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Zap,
      title: 'Intelligent Triage',
      description: 'AI learns your patterns and automatically organizes issues and PRs by priority and type. Save hours every week.',
      highlights: ['Pattern recognition', 'Auto-labeling', 'Prioritization engine'],
    },
    {
      icon: Filter,
      title: 'Custom Workflows',
      description: 'Define your own rules for how work flows through your repository. No rigid templates.',
      highlights: ['Rule builder', 'Conditional logic', 'Custom actions'],
    },
    {
      icon: Users2,
      title: 'Contributor Insights',
      description: "Understand your community without reducing them to numbers. Real context about who's contributing.",
      highlights: ['Contribution patterns', 'Relationship tracking', 'Recognition tools'],
    },
    {
      icon: BookOpen,
      title: 'Smart Documentation',
      description: 'Keep docs in sync with your project. AI suggests updates based on changes and contributor questions.',
      highlights: ['Auto-sync', 'Gap detection', 'Quality checks'],
    },
    {
      icon: Bell,
      title: 'Mindful Notifications',
      description: 'Get alerts when they matter. Customizable thresholds prevent notification fatigue.',
      highlights: ['Smart filtering', 'Digest options', 'Priority-based routing'],
    },
    {
      icon: Code2,
      title: 'Repository Analytics',
      description: 'See what actually matters: health indicators, contributor wellness, and community momentum.',
      highlights: ['Health metrics', 'Trend analysis', 'Community signals'],
    },
  ];

  return (
    <section id="features" className="relative py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Everything you need to run a healthy repository
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Powerful tools built specifically for the way maintainers actually work.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="glass-panel glass-panel-hover p-6"
              >
                <div className="icon-badge mb-4">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-accent-primary" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Feature showcase */}
        <div className="mt-20 glass-panel p-8 md:p-12 section-glow">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">Designed by maintainers</h3>
              <p className="text-muted-foreground mb-6">
                Every feature in MaintainerOS came from conversations with real open source maintainers. We understand the unique challenges you face because we&apos;ve faced them too.
              </p>
              <ul className="space-y-3">
                {['Built with maintainer feedback', 'Regularly updated based on community input', 'Open about our roadmap'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent-primary flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="h-64 md:h-80 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 rounded-xl border border-white/5 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Product screenshot</p>
                <p className="text-xs text-muted-foreground/60">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
