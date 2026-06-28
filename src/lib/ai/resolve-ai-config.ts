import { isServerChainConfigured } from "@/lib/ai/providers/create-language-model";
import { AiConfigError, type AiRequestConfig, type ResolvedAiConfig } from "@/lib/ai/types";

const BYOK_PROVIDERS = new Set(["gemini", "openrouter"]);

export function resolveAiConfig(aiConfig?: AiRequestConfig): ResolvedAiConfig {
  if (aiConfig?.provider === "mock") {
    return { mode: "mock" };
  }

  if (aiConfig?.provider === "auto") {
    if (isServerChainConfigured()) {
      return { mode: "chain", model: aiConfig.model?.trim() || undefined };
    }

    if (process.env.MOCK_AI === "true") {
      return { mode: "mock" };
    }

    throw new AiConfigError(
      "No server AI keys configured. Add keys to the environment or switch to Mock mode.",
      "MISSING_API_KEY",
      400,
    );
  }

  if (aiConfig?.provider && BYOK_PROVIDERS.has(aiConfig.provider)) {
    if (!aiConfig.apiKey?.trim()) {
      throw new AiConfigError(
        "Add your API key in AI settings or switch to Mock mode for testing.",
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

  if (process.env.MOCK_AI === "true") {
    return { mode: "mock" };
  }

  throw new AiConfigError(
    "Configure an AI provider in settings (Mock mode works without a key).",
    "MISSING_API_KEY",
    400,
  );
}

export function toAiRequestConfig(config: ResolvedAiConfig): AiRequestConfig {
  if (config.mode === "mock") {
    return { provider: "mock" };
  }

  if (config.mode === "chain") {
    return { provider: "auto", model: config.model };
  }

  return {
    provider: config.provider ?? "gemini",
    apiKey: config.apiKey,
    model: config.model,
  };
}
