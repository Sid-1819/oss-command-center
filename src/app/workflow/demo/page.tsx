'use client';

import { ExecutionWorkflow } from '@/components/workflow/execution-workflow';
import type { MaintenanceAction } from '@/types/execution-workflow';

const mockAction: MaintenanceAction = {
  id: 'action-001',
  type: 'documentation',
  title: 'Update API Documentation',
  description: 'The API documentation for authentication endpoints is outdated and missing recent changes.',
  reasoning:
    'The recent authentication refactor introduced new OAuth2 scopes and updated several endpoints. The current documentation does not reflect these changes, causing confusion for API consumers. This action will update the authentication guide, add examples for new scopes, and update endpoint references to match the current implementation.',
  repository: 'oss-command-center',
  repositoryUrl: 'https://github.com/Sid-1819/oss-command-center',
  status: 'review',
  proposedChanges: [
    {
      path: 'docs/api/authentication.md',
      action: 'modify',
      summary: 'Updated OAuth2 scope documentation and added new examples',
      beforeContent: `# Authentication

## OAuth2 Scopes
- \`read:repos\`
- \`write:repos\``,
      afterContent: `# Authentication

## OAuth2 Scopes
- \`read:repos\` - Read repository data
- \`write:repos\` - Modify repository content
- \`admin:repo_hook\` - Manage webhooks (new)
- \`gist\` - Create and manage gists (new)

## Usage Example
\`\`\`javascript
const scopes = ['read:repos', 'write:repos', 'admin:repo_hook'];
const url = \`https://github.com/login/oauth/authorize?client_id=\${clientId}&scope=\${scopes.join(',')}\`;
\`\`\``,
      linesAdded: 12,
      linesRemoved: 3,
    },
    {
      path: 'docs/api/endpoints.md',
      action: 'modify',
      summary: 'Added missing endpoint documentation and fixed endpoint paths',
      beforeContent: `# API Endpoints

## GET /repos/:owner/:repo
Returns repository information.`,
      afterContent: `# API Endpoints

## GET /repos/:owner/:repo
Returns repository information.

\`\`\`bash
curl https://api.github.com/repos/owner/repo
\`\`\`

## POST /repos/:owner/:repo/webhooks
Creates a webhook for repository events.

\`\`\`bash
curl -X POST https://api.github.com/repos/owner/repo/webhooks \\
  -H "Authorization: Bearer TOKEN" \\
  -d '{"events": ["push", "pull_request"]}'
\`\`\``,
      linesAdded: 14,
      linesRemoved: 1,
    },
    {
      path: 'docs/api/examples/oauth-flow.md',
      action: 'create',
      summary: 'New OAuth flow example with new scopes',
      afterContent: `# OAuth Flow Example

## Step 1: Request Authorization
Redirect user to GitHub OAuth endpoint with your scopes.

\`\`\`javascript
const clientId = 'your-client-id';
const redirectUri = 'https://yourapp.com/callback';
const scopes = ['read:repos', 'admin:repo_hook'];

const authUrl = \`https://github.com/login/oauth/authorize?client_id=\${clientId}&redirect_uri=\${redirectUri}&scope=\${scopes.join(',')}\`;
\`\`\`

## Step 2: Handle Callback
Exchange authorization code for access token.

\`\`\`javascript
const response = await fetch('https://github.com/login/oauth/access_token', {
  method: 'POST',
  headers: { 'Accept': 'application/json' },
  body: JSON.stringify({
    client_id: clientId,
    client_secret: process.env.GITHUB_SECRET,
    code: authorizationCode,
  }),
});

const { access_token } = await response.json();
\`\`\``,
      linesAdded: 30,
      linesRemoved: 0,
    },
  ],
  preflightChecks: [
    {
      id: 'check-1',
      name: 'Markdown Linting',
      description: 'Validate markdown syntax and formatting',
      status: 'success',
      details: 'All files passed markdown validation',
    },
    {
      id: 'check-2',
      name: 'Link Validation',
      description: 'Check that all documentation links are valid',
      status: 'success',
      details: 'All internal and external links are reachable',
    },
    {
      id: 'check-3',
      name: 'Code Examples Validation',
      description: 'Verify code examples in documentation are syntactically correct',
      status: 'success',
      details: 'All code blocks passed syntax validation',
    },
    {
      id: 'check-4',
      name: 'Build Documentation',
      description: 'Build documentation to ensure no breaking changes',
      status: 'success',
      details: 'Documentation built successfully',
    },
  ],
  createdAt: new Date(),
};

export default function WorkflowDemoPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Execution Workflow Demo</h1>
          <p className="text-muted-foreground">
            Experience the trust-focused maintenance action execution interface
          </p>
        </div>

        <ExecutionWorkflow action={mockAction} />
      </div>
    </div>
  );
}
