"use client";

import type { AiProviderId, AiRequestConfig } from "@/lib/ai/types";

export const AI_CONFIG_STORAGE_KEY = "maintaineros:ai-config";

export interface StoredAiConfig extends AiRequestConfig {
  updatedAt: string;
}

const VALID_PROVIDERS = new Set<AiProviderId>([
  "mock",
  "auto",
  "gemini",
  "openrouter",
]);

function normalizeProvider(provider: string): AiProviderId {
  if (VALID_PROVIDERS.has(provider as AiProviderId)) {
    return provider as AiProviderId;
  }

  return "auto";
}

function defaultProvider(): AiProviderId {
  const envDefault = process.env.NEXT_PUBLIC_DEFAULT_AI_PROVIDER;

  if (
    envDefault === "mock" ||
    envDefault === "auto" ||
    envDefault === "gemini" ||
    envDefault === "openrouter"
  ) {
    return envDefault;
  }

  return "mock";
}

export function isServerAiConfigured(): boolean {
  return process.env.NEXT_PUBLIC_AI_SERVER_CONFIGURED === "true";
}

export function loadAiConfig(): StoredAiConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAiConfig;
    return {
      ...parsed,
      provider: normalizeProvider(parsed.provider),
    };
  } catch {
    return null;
  }
}

export function saveAiConfig(config: AiRequestConfig): StoredAiConfig {
  const stored: StoredAiConfig = {
    provider: config.provider,
    apiKey: config.apiKey?.trim() || undefined,
    model: config.model?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(stored));
  }

  return stored;
}

export function clearAiConfig(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
  }
}

export function getEffectiveAiConfig(): AiRequestConfig {
  const stored = loadAiConfig();

  if (stored) {
    return {
      provider: stored.provider,
      apiKey: stored.apiKey,
      model: stored.model,
    };
  }

  if (isServerAiConfigured()) {
    return { provider: "auto" };
  }

  return { provider: defaultProvider() };
}

export function isAiConfigReady(config: AiRequestConfig = getEffectiveAiConfig()): boolean {
  if (config.provider === "mock" || config.provider === "auto") {
    return true;
  }

  return Boolean(config.apiKey?.trim());
}

export function aiConfigLabel(config: AiRequestConfig = getEffectiveAiConfig()): string {
  if (config.provider === "mock") {
    return "Mock data";
  }

  if (config.provider === "auto") {
    return isServerAiConfigured() ? "Server AI" : "Server AI (auto)";
  }

  if (!config.apiKey?.trim()) {
    return "API key required";
  }

  return `${config.provider}${config.model ? ` · ${config.model}` : ""}`;
}
