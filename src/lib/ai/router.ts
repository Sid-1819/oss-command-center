import type { LanguageModelSpec } from "@/lib/ai/providers/create-language-model";
import {
  DEFAULT_MODELS,
  type AiOperation,
  type ByokProviderId,
} from "@/lib/ai/types";

export type AiTaskType = "reasoning" | "documentation";

export const GEMINI_MODELS = {
  reasoning: "gemini-2.5-flash",
  documentation: "gemini-3.1-flash-lite",
} as const;

const OPERATION_TASK_TYPES: Record<AiOperation, AiTaskType> = {
  "maintainer-briefing": "reasoning",
  "issue-fix-plan": "reasoning",
  "markdown-doc-plan": "documentation",
};

export function getTaskTypeForOperation(operation: AiOperation): AiTaskType {
  return OPERATION_TASK_TYPES[operation];
}

export function getPrimaryGeminiModel(taskType: AiTaskType): string {
  return GEMINI_MODELS[taskType];
}

export function getGeminiModelChain(taskType: AiTaskType): string[] {
  if (taskType === "reasoning") {
    return [GEMINI_MODELS.reasoning, GEMINI_MODELS.documentation];
  }

  return [GEMINI_MODELS.documentation, GEMINI_MODELS.reasoning];
}

export function getDefaultModelForProvider(
  provider: ByokProviderId,
  taskType: AiTaskType,
): string {
  if (provider === "gemini") {
    return getPrimaryGeminiModel(taskType);
  }

  return DEFAULT_MODELS[provider];
}

export function getServerProviderChain(taskType: AiTaskType): LanguageModelSpec[] {
  const chain: LanguageModelSpec[] = [];

  const googleKey = process.env.GOOGLE_API_KEY?.trim();
  if (googleKey) {
    for (const model of getGeminiModelChain(taskType)) {
      chain.push({
        provider: "gemini",
        model,
        apiKey: googleKey,
      });
    }
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    chain.push({
      provider: "openrouter",
      model: DEFAULT_MODELS.openrouter,
      apiKey: openRouterKey,
    });
  }

  return chain;
}

export function isServerChainConfigured(): boolean {
  return getServerProviderChain("reasoning").length > 0;
}
