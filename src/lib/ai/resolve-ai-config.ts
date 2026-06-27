import { AiConfigError, type AiRequestConfig } from "@/lib/ai/types";

export function resolveAiConfig(aiConfig?: AiRequestConfig): AiRequestConfig {
  if (aiConfig?.provider) {
    if (aiConfig.provider !== "mock" && !aiConfig.apiKey?.trim()) {
      throw new AiConfigError(
        "Add your API key in AI settings or switch to Mock mode for testing.",
        "MISSING_API_KEY",
        400,
      );
    }

    return {
      provider: aiConfig.provider,
      apiKey: aiConfig.apiKey?.trim(),
      model: aiConfig.model?.trim() || undefined,
    };
  }

  if (process.env.MOCK_AI === "true") {
    return { provider: "mock" };
  }

  throw new AiConfigError(
    "Configure an AI provider in settings (Mock mode works without a key).",
    "MISSING_API_KEY",
    400,
  );
}
