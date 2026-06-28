import type { LanguageModel } from "ai";
import {
  createByokLanguageModel,
  createLanguageModel,
  getServerProviderChain,
  type LanguageModelSpec,
} from "@/lib/ai/providers/create-language-model";
import { AiConfigError, type ChainProviderId, type ResolvedAiConfig } from "@/lib/ai/types";

export interface ResolvedModelTarget {
  mode: ResolvedAiConfig["mode"];
  models: LanguageModelSpec[];
  modelOverride?: string;
}

export function resolveModelTargets(config: ResolvedAiConfig): ResolvedModelTarget {
  if (config.mode === "mock") {
    return { mode: "mock", models: [] };
  }

  if (config.mode === "byok") {
    const provider = config.provider;

    if (
      !provider ||
      !config.apiKey ||
      (provider !== "gemini" && provider !== "openrouter")
    ) {
      throw new AiConfigError(
        "Unsupported BYOK provider.",
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
          model: config.model?.trim() || "",
        },
      ],
      modelOverride: config.model,
    };
  }

  const chain = getServerProviderChain();

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
  if (spec.model) {
    return createLanguageModel(spec, modelOverride);
  }

  return createByokLanguageModel(spec.provider, spec.apiKey, modelOverride);
}

export function providerLabel(provider: ChainProviderId): string {
  return provider;
}
