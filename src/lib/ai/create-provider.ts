import { AiConfigError, type AiProvider, type AiRequestConfig } from "@/lib/ai/types";
import { createMockProvider } from "@/lib/ai/providers/mock";
import { createByokLanguageModel } from "@/lib/ai/providers/create-language-model";
import { generateObject } from "ai";

function createByokProvider(
  id: "gemini" | "openrouter",
  config: AiRequestConfig,
): AiProvider {
  const apiKey = config.apiKey?.trim();

  if (!apiKey) {
    throw new AiConfigError(
      `${id} API key is required. Add it in AI settings.`,
      "MISSING_API_KEY",
      400,
    );
  }

  const model = createByokLanguageModel(id, apiKey, config.model);

  return {
    id,
    async generateRawJson(request) {
      const { object } = await generateObject({
        model,
        schema: request.schema,
        system: request.systemInstruction,
        prompt: request.userPrompt,
      });

      return JSON.stringify(object);
    },
  };
}

export function createAiProvider(config: AiRequestConfig): AiProvider {
  switch (config.provider) {
    case "mock":
      return createMockProvider();
    case "auto":
      throw new AiConfigError(
        "Server chain mode should use generateStructuredObject directly.",
        "PROVIDER_NOT_IMPLEMENTED",
        501,
      );
    case "gemini":
      return createByokProvider("gemini", config);
    case "openrouter":
      return createByokProvider("openrouter", config);
    default:
      throw new AiConfigError(
        "Unsupported AI provider.",
        "PROVIDER_NOT_IMPLEMENTED",
        501,
      );
  }
}
