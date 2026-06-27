import { GoogleGenAI } from "@google/genai";
import { getGeminiErrorInfo } from "@/lib/ai/gemini-errors";
import { AiConfigError, DEFAULT_MODELS, type AiProvider, type AiRequestConfig, type StructuredJsonRequest } from "@/lib/ai/types";
import { ApiError } from "@google/genai";
import { toJSONSchema } from "zod";

export function createGeminiProvider(config: AiRequestConfig): AiProvider {
  const apiKey = config.apiKey?.trim();

  if (!apiKey) {
    throw new AiConfigError(
      "Gemini API key is required.",
      "MISSING_API_KEY",
      400,
    );
  }

  const genAI = new GoogleGenAI({ apiKey });
  const model = config.model?.trim() || DEFAULT_MODELS.gemini;

  return {
    id: "gemini",
    async generateRawJson(request: StructuredJsonRequest): Promise<string> {
      try {
        const response = await genAI.models.generateContent({
          model,
          contents: request.userPrompt,
          config: {
            systemInstruction: request.systemInstruction,
            responseMimeType: "application/json",
            responseJsonSchema: toJSONSchema(request.schema),
          },
        });

        return response.text ?? "";
      } catch (error) {
        if (error instanceof ApiError) {
          const info = getGeminiErrorInfo(error);
          throw new AiConfigError(info.message, info.code, info.status);
        }

        throw error;
      }
    },
  };
}
