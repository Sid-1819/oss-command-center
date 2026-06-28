import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { DEFAULT_MODELS, type ByokProviderId } from "@/lib/ai/types";

export interface LanguageModelSpec {
  provider: ByokProviderId;
  model: string;
  apiKey: string;
}

export { getServerProviderChain, isServerChainConfigured } from "@/lib/ai/router";

export function createByokLanguageModel(
  provider: ByokProviderId,
  apiKey: string,
  model?: string,
): LanguageModel {
  const modelId = model?.trim() || DEFAULT_MODELS[provider];

  switch (provider) {
    case "gemini":
      return createGoogle({ apiKey })(modelId);
    case "openrouter": {
      const client = createOpenRouter({ apiKey });
      return client(modelId, {
        usage: { include: true },
      });
    }
    case "openai":
      return createOpenAI({ apiKey })(modelId);
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
    case "mistral":
      return createMistral({ apiKey })(modelId);
    case "groq":
      return createGroq({ apiKey })(modelId);
    case "xai":
      return createXai({ apiKey })(modelId);
    default:
      throw new Error(`Unsupported MaintainerOS AI provider: ${provider satisfies never}`);
  }
}
