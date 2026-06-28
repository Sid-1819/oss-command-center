import { AiConfigError, type AiProvider, type AiRequestConfig, type ByokProviderId } from "@/lib/ai/types";
import { createMockProvider } from "@/lib/ai/providers/mock";
import { createByokLanguageModel } from "@/lib/ai/providers/create-language-model";
import { generateObject } from "ai";

function createByokProvider(id: ByokProviderId, config: AiRequestConfig): AiProvider {
  const apiKey = config.apiKey?.trim();

  if (!apiKey) {
    throw new AiConfigError(
      "Add your provider API key in MaintainerOS AI settings.",
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
        "Hosted MaintainerOS AI should use generateStructuredObject directly.",
        "PROVIDER_NOT_IMPLEMENTED",
        501,
      );
    case "gemini":
    case "openrouter":
    case "openai":
    case "anthropic":
    case "mistral":
    case "groq":
    case "xai":
      return createByokProvider(config.provider, config);
    default:
      throw new AiConfigError(
        "Unsupported MaintainerOS AI provider.",
        "PROVIDER_NOT_IMPLEMENTED",
        501,
      );
  }
}
