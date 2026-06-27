import { AiConfigError, type AiProvider } from "@/lib/ai/types";

function stubProvider(id: "openai" | "anthropic", label: string): AiProvider {
  return {
    id,
    async generateRawJson() {
      throw new AiConfigError(
        `${label} support is coming soon. Use Mock mode for testing or Gemini with your API key.`,
        "PROVIDER_NOT_IMPLEMENTED",
        501,
      );
    },
  };
}

export function createOpenAiStubProvider(): AiProvider {
  return stubProvider("openai", "OpenAI");
}

export function createAnthropicStubProvider(): AiProvider {
  return stubProvider("anthropic", "Claude");
}
