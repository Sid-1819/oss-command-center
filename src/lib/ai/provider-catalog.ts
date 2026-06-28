import type { AiProviderId, ByokProviderId } from "@/lib/ai/types";

export type AiProviderGroup = "hosted" | "dev" | "byok";

export interface AiProviderOption {
  id: AiProviderId;
  label: string;
  description: string;
  requiresKey: boolean;
  docsUrl?: string;
  defaultModel?: string;
  group: AiProviderGroup;
}

/** Providers users can connect with their own API key (not our hosted free tier). */
export const BYOK_PROVIDER_IDS = [
  "openai",
  "anthropic",
  "gemini",
  "groq",
  "mistral",
  "xai",
] as const satisfies readonly ByokProviderId[];

export const HOSTED_PROVIDER_OPTION: AiProviderOption = {
  id: "auto",
  label: "MaintainerOS AI",
  description:
    "Hosted MaintainerOS AI powered by free Gemini and OpenRouter models with automatic failover. No API key required.",
  requiresKey: false,
  group: "hosted",
};

export const DEV_DEMO_PROVIDER_OPTION: AiProviderOption = {
  id: "mock",
  label: "Local demo fixtures",
  description:
    "Deterministic fixture data for local development and testing. No API calls or keys.",
  requiresKey: false,
  group: "dev",
};

export const BYOK_PROVIDER_OPTIONS: AiProviderOption[] = [
  {
    id: "openai",
    label: "OpenAI",
    description: "Connect your OpenAI API key.",
    requiresKey: true,
    docsUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o-mini",
    group: "byok",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    description: "Connect your Anthropic API key.",
    requiresKey: true,
    docsUrl: "https://console.anthropic.com/settings/keys",
    defaultModel: "claude-3-5-haiku-latest",
    group: "byok",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    description: "Connect your Google AI Studio API key.",
    requiresKey: true,
    docsUrl: "https://ai.google.dev/gemini-api/docs/api-key",
    defaultModel: "gemini-2.5-flash",
    group: "byok",
  },
  {
    id: "groq",
    label: "Groq",
    description: "Connect your Groq API key.",
    requiresKey: true,
    docsUrl: "https://console.groq.com/keys",
    defaultModel: "llama-3.3-70b-versatile",
    group: "byok",
  },
  {
    id: "mistral",
    label: "Mistral",
    description: "Connect your Mistral API key.",
    requiresKey: true,
    docsUrl: "https://console.mistral.ai/api-keys",
    defaultModel: "mistral-small-latest",
    group: "byok",
  },
  {
    id: "xai",
    label: "xAI",
    description: "Connect your xAI API key.",
    requiresKey: true,
    docsUrl: "https://console.x.ai/",
    defaultModel: "grok-2-1212",
    group: "byok",
  },
];

/** All valid stored provider ids (includes legacy openrouter BYOK). */
export const AI_PROVIDER_OPTIONS: AiProviderOption[] = [
  HOSTED_PROVIDER_OPTION,
  DEV_DEMO_PROVIDER_OPTION,
  ...BYOK_PROVIDER_OPTIONS,
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "Legacy BYOK OpenRouter configuration.",
    requiresKey: true,
    docsUrl: "https://openrouter.ai/keys",
    defaultModel: "openrouter/free",
    group: "byok",
  },
];

export function isLocalDevAiTestingEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_AI_DEMO === "true"
  );
}

export function getAiProviderOption(id: AiProviderId): AiProviderOption | undefined {
  return AI_PROVIDER_OPTIONS.find((option) => option.id === id);
}

export function isByokProvider(id: AiProviderId): id is ByokProviderId {
  return (
    (BYOK_PROVIDER_IDS as readonly AiProviderId[]).includes(id) || id === "openrouter"
  );
}

export function isHostedProvider(id: AiProviderId): boolean {
  return id === "auto";
}

export function isDevDemoProvider(id: AiProviderId): boolean {
  return id === "mock";
}

export function maintainerOsAiLabel(config: {
  provider: AiProviderId;
  model?: string;
}): string {
  if (config.provider === "auto") {
    return "MaintainerOS AI";
  }

  if (config.provider === "mock") {
    return "Local demo";
  }

  const option = getAiProviderOption(config.provider);
  const base = option?.label ?? "Custom provider";

  if (config.model?.trim()) {
    return `${base} · ${config.model.trim()}`;
  }

  return base;
}

export function getDefaultByokProvider(): ByokProviderId {
  return "openai";
}
