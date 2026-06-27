import { CheckCircle2, GitPullRequest, Users, BarChart3, AlertCircle, Brain } from 'lucide-react';

export default function Philosophy() {
  const principles = [
    {
      icon: Brain,
      title: 'Intentional over automatic',
      description: 'Make deliberate decisions about your workflow. No metrics theater—just what matters.',
    },
    {
      icon: Users,
      title: 'Community-first',
      description: 'Your contributors are people, not datapoints. Manage relationships with respect and clarity.',
    },
    {
      icon: AlertCircle,
      title: 'Transparent communication',
      description: 'Clear, honest updates about your repository status and what needs attention.',
    },
    {
      icon: GitPullRequest,
      title: 'Smart triage',
      description: 'AI-assisted organization that learns your values and priorities over time.',
    },
    {
      icon: CheckCircle2,
      title: 'Your rules',
      description: 'Customize workflows, automation rules, and decision frameworks to match your vision.',
    },
    {
      icon: BarChart3,
      title: 'Insights that matter',
      description: 'Get visibility into health trends and contributor patterns without vanity metrics.',
    },
  ];

  return (
    <section id="philosophy" className="relative py-20 px-6 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Built on principles, not dashboards
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            MaintainerOS rejects the metrics-driven approach to open source. We believe maintainers deserve tools that respect their time and values.
          </p>
        </div>

        {/* Principles grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {principles.map((principle, idx) => {
            const Icon = principle.icon;
            return (
              <div
                key={idx}
                className="glass-panel glass-panel-hover p-6"
              >
                <div className="icon-badge mb-4">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{principle.title}</h3>
                <p className="text-sm text-muted-foreground">{principle.description}</p>
              </div>
            );
          })}
        </div>

        {/* Philosophy statement */}
        <div className="mt-20 glass-panel p-8 md:p-12 max-w-3xl mx-auto text-center">
          <blockquote className="text-lg md:text-xl text-foreground mb-4">
            &quot;Open source is a gift. Your time maintaining it deserves respect. MaintainerOS gives you back agency—the ability to work how <em>you</em> want, not how metrics say you should.&quot;
          </blockquote>
          <p className="text-sm text-muted-foreground">— The MaintainerOS philosophy</p>
        </div>
      </div>
    </section>
  );
}
