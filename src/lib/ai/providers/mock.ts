import type { AiOperation, AiProvider, StructuredJsonRequest } from "@/lib/ai/types";
import maintainerBriefingFixture from "@/lib/ai/fixtures/maintainer-briefing.json";
import markdownDocPlanFixture from "@/lib/ai/fixtures/markdown-doc-plan.json";
import issueFixPlanFixture from "@/lib/ai/fixtures/issue-fix-plan.json";

const FIXTURES: Record<AiOperation, unknown> = {
  "maintainer-briefing": maintainerBriefingFixture,
  "markdown-doc-plan": markdownDocPlanFixture,
  "issue-fix-plan": issueFixPlanFixture,
};

export function createMockProvider(): AiProvider {
  return {
    id: "mock",
    async generateRawJson(request: StructuredJsonRequest): Promise<string> {
      const fixture = FIXTURES[request.operation];

      if (!fixture) {
        return JSON.stringify({ error: "unknown operation" });
      }

      return JSON.stringify(fixture);
    },
  };
}

export { maintainerBriefingFixture, markdownDocPlanFixture, issueFixPlanFixture };
