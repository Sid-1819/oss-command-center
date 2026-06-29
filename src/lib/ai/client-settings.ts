"use client";

import {
  AI_PROVIDER_OPTIONS,
  getAiProviderOption,
  getDefaultByokProvider,
  isByokProvider,
  isHostedProvider,
  maintainerOsAiLabel,
  normalizeStoredProvider,
} from "@/lib/ai/provider-catalog";
import type { AiProviderId, AiRequestConfig, ByokProviderId } from "@/lib/ai/types";

export const AI_CONFIG_STORAGE_KEY = "maintaineros:ai-config";

export interface StoredAiConfig extends AiRequestConfig {
  updatedAt: string;
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
      provider: normalizeStoredProvider(parsed.provider),
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

  return { provider: "auto" };
}

export function isAiConfigReady(config: AiRequestConfig = getEffectiveAiConfig()): boolean {
  if (isHostedProvider(config.provider)) {
    return true;
  }

  if (isByokProvider(config.provider)) {
    return Boolean(config.apiKey?.trim());
  }

  return true;
}

export function aiConfigLabel(config: AiRequestConfig = getEffectiveAiConfig()): string {
  if (isByokProvider(config.provider) && !config.apiKey?.trim()) {
    return "API key required";
  }

  return maintainerOsAiLabel(config);
}

export function getDefaultModelForProviderOption(provider: AiProviderId): string | undefined {
  return getAiProviderOption(provider)?.defaultModel;
}

export function usesOwnProviderKey(config: AiRequestConfig): boolean {
  return isByokProvider(config.provider);
}

export { getDefaultByokProvider };
export type { ByokProviderId };
