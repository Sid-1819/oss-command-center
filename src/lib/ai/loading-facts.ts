const AI_LOADING_FACTS = [
  'AI can scan thousands of lines of code in seconds to spot stale documentation.',
  'Many open-source maintainers spend more time on triage than on feature work.',
  'Automated doc updates often land before contributors notice the drift.',
  'Small, focused PRs from AI are easier to review than large catch-up changes.',
  'Issue labels and titles give AI strong hints about where a fix should live.',
  'Changelog and README updates are among the most common maintenance tasks.',
  'AI works best when it has recent repo context — issues, PRs, and file contents.',
  'Preflight checks help catch broken links and formatting before a PR is opened.',
  'Typos in docs and comments are low-risk fixes that save reviewer attention.',
  'Semantic search helps AI find the right file even when names do not match exactly.',
  'Maintainers who batch doc fixes weekly often see fewer duplicate issue reports.',
  'AI-generated plans let you approve changes before anything hits your default branch.',
  'Security advisories and dependency bumps benefit from consistent, repeatable workflows.',
  'Good commit messages in past PRs teach AI how your project prefers to describe changes.',
  'Demo mode lets you walk through the full flow without spending API quota.',
  'Structured output from models makes plans and diffs predictable for review UIs.',
  'Contributor-friendly repos keep installation steps accurate — AI can help refresh them.',
  'Release notes drafted from merged PRs reduce last-minute release friction.',
  'Reviewing an AI plan takes less time than writing the fix from scratch.',
  'Caching analysis results avoids re-fetching the same briefing on every visit.',
];

export function getRandomAiLoadingFact(): string {
  const index = Math.floor(Math.random() * AI_LOADING_FACTS.length);
  return AI_LOADING_FACTS[index] ?? AI_LOADING_FACTS[0];
}
