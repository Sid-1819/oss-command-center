import { executeIssueFixAction } from "@/actions/issue-fix/executeIssueFixAction";
import { planIssueFixAction } from "@/actions/issue-fix/planIssueFixAction";
import { executeMarkdownDocAction } from "@/actions/markdown-doc/executeMarkdownDocAction";
import { planMarkdownDocAction } from "@/actions/markdown-doc/planMarkdownDocAction";
import {
  buildIssueFixActionRun,
  buildMarkdownDocActionRun,
} from "@/lib/action-run/build-action-run";
import type { ActionRunType } from "@/types/action-run";

export const actionRegistry = {
  "markdown-doc": {
    plan: planMarkdownDocAction,
    execute: executeMarkdownDocAction,
    buildActionRun: buildMarkdownDocActionRun,
  },
  "issue-fix": {
    plan: planIssueFixAction,
    execute: executeIssueFixAction,
    buildActionRun: buildIssueFixActionRun,
  },
  readme: {
    plan: planMarkdownDocAction,
    execute: executeMarkdownDocAction,
    buildActionRun: buildMarkdownDocActionRun,
  },
} as const;

export type RegisteredActionType = keyof typeof actionRegistry;

export function resolveActionType(type: ActionRunType): RegisteredActionType {
  if (type === "readme") return "markdown-doc";
  return type;
}
