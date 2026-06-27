import { AiConfigError, type AiProvider, type AiRequestConfig } from "@/lib/ai/types";
import { createGeminiProvider } from "@/lib/ai/providers/gemini";
import { createMockProvider } from "@/lib/ai/providers/mock";
import {
  createAnthropicStubProvider,
  createOpenAiStubProvider,
} from "@/lib/ai/providers/stubs";

export function createAiProvider(config: AiRequestConfig): AiProvider {
  switch (config.provider) {
    case "mock":
      return createMockProvider();
    case "gemini":
      if (!config.apiKey?.trim()) {
        throw new AiConfigError(
          "Gemini API key is required. Add it in AI settings.",
          "MISSING_API_KEY",
          400,
        );
      }
      return createGeminiProvider(config);
    case "openai":
      return createOpenAiStubProvider();
    case "anthropic":
      return createAnthropicStubProvider();
    default:
      throw new AiConfigError(
        "Unsupported AI provider.",
        "PROVIDER_NOT_IMPLEMENTED",
        501,
      );
  }
}
