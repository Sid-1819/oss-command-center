import { isByokProvider } from "@/lib/ai/provider-catalog";
import { isServerChainConfigured } from "@/lib/ai/providers/create-language-model";
import { AiConfigError, type AiRequestConfig, type ResolvedAiConfig } from "@/lib/ai/types";

export function resolveAiConfig(aiConfig?: AiRequestConfig): ResolvedAiConfig {
  if (aiConfig?.provider === "auto") {
    if (isServerChainConfigured()) {
      return { mode: "chain", model: aiConfig.model?.trim() || undefined };
    }

    throw new AiConfigError(
      "No hosted MaintainerOS AI keys configured. Connect a compatible provider in settings.",
      "MISSING_API_KEY",
      400,
    );
  }

  if (aiConfig?.provider && isByokProvider(aiConfig.provider)) {
    if (!aiConfig.apiKey?.trim()) {
      throw new AiConfigError(
        "Select a compatible provider and add its API key, or use MaintainerOS AI (no key required).",
        "MISSING_API_KEY",
        400,
      );
    }

    return {
      mode: "byok",
      provider: aiConfig.provider,
      apiKey: aiConfig.apiKey.trim(),
      model: aiConfig.model?.trim() || undefined,
    };
  }

  if (isServerChainConfigured()) {
    return { mode: "chain" };
  }

  throw new AiConfigError(
    "Configure MaintainerOS AI server keys or connect your own provider in settings.",
    "MISSING_API_KEY",
    400,
  );
}

export function toAiRequestConfig(config: ResolvedAiConfig): AiRequestConfig {
  if (config.mode === "chain") {
    return { provider: "auto", model: config.model };
  }

  return {
    provider: config.provider ?? "gemini",
    apiKey: config.apiKey,
    model: config.model,
  };
}
