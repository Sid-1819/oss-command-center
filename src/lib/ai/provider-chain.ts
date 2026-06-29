import type { LanguageModel } from "ai";
import {
  createByokLanguageModel,
  getServerProviderChain,
  type LanguageModelSpec,
} from "@/lib/ai/providers/create-language-model";
import {
  getDefaultModelForProvider,
  getTaskTypeForOperation,
} from "@/lib/ai/router";
import {
  AiConfigError,
  type AiOperation,
  type ByokProviderId,
  type ResolvedAiConfig,
} from "@/lib/ai/types";

export interface ResolvedModelTarget {
  mode: ResolvedAiConfig["mode"];
  models: LanguageModelSpec[];
  modelOverride?: string;
}

export function resolveModelTargets(
  config: ResolvedAiConfig,
  operation: AiOperation,
): ResolvedModelTarget {
  const taskType = getTaskTypeForOperation(operation);

  if (config.mode === "byok") {
    const provider = config.provider;

    if (!provider || !config.apiKey) {
      throw new AiConfigError(
        "Unsupported MaintainerOS AI provider configuration.",
        "PROVIDER_NOT_IMPLEMENTED",
        501,
      );
    }

    return {
      mode: "byok",
      models: [
        {
          provider,
          apiKey: config.apiKey,
          model: config.model?.trim() || getDefaultModelForProvider(provider, taskType),
        },
      ],
      modelOverride: config.model,
    };
  }

  const chain = getServerProviderChain(taskType);

  if (chain.length === 0) {
    throw new AiConfigError(
      "No server AI keys configured. Set GOOGLE_API_KEY or OPENROUTER_API_KEY.",
      "MISSING_API_KEY",
      400,
    );
  }

  return {
    mode: "chain",
    models: chain,
    modelOverride: config.model,
  };
}

export function toLanguageModel(
  spec: LanguageModelSpec,
  modelOverride?: string,
): LanguageModel {
  return createByokLanguageModel(spec.provider, spec.apiKey, modelOverride || spec.model);
}

export function providerLabel(provider: ByokProviderId): string {
  return provider;
}
