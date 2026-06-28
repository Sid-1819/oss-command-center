import { createHash } from "node:crypto";
import type { AiOperation, AiRequestConfig, ResolvedAiConfig } from "@/lib/ai/types";
import { toAiRequestConfig } from "@/lib/ai/resolve-ai-config";

const TTL_HOURS: Record<AiOperation, number> = {
  "maintainer-briefing": Number(process.env.AI_CACHE_BRIEFING_TTL_HOURS ?? 6),
  "markdown-doc-plan": Number(process.env.AI_CACHE_PLAN_TTL_HOURS ?? 24),
  "issue-fix-plan": Number(process.env.AI_CACHE_PLAN_TTL_HOURS ?? 24),
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

export function buildCacheFingerprint(
  operation: AiOperation,
  aiConfig: AiRequestConfig | ResolvedAiConfig,
  inputs: Record<string, unknown>,
): string {
  const normalized =
    "mode" in aiConfig ? toAiRequestConfig(aiConfig) : aiConfig;

  const payload =
    normalized.provider === "auto" || normalized.provider === "mock"
      ? stableStringify({
          operation,
          inputs,
        })
      : stableStringify({
          operation,
          provider: normalized.provider,
          model: normalized.model ?? "default",
          inputs,
        });

  return createHash("sha256").update(payload).digest("hex");
}

export function getCacheTtlMs(operation: AiOperation): number {
  return TTL_HOURS[operation] * 60 * 60 * 1000;
}

export function isCacheEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function getCachedResponse<T>(
  fingerprint: string,
  operation: AiOperation,
): Promise<T | null> {
  if (!isCacheEnabled()) {
    return null;
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const entry = await prisma.aiResponseCache.findUnique({
      where: { id: fingerprint },
    });

    if (!entry || entry.expiresAt < new Date()) {
      if (entry) {
        await prisma.aiResponseCache.delete({ where: { id: fingerprint } }).catch(() => undefined);
      }
      return null;
    }

    return entry.responseJson as T;
  } catch {
    return null;
  }
}

export async function setCachedResponse(
  fingerprint: string,
  operation: AiOperation,
  aiConfig: AiRequestConfig | ResolvedAiConfig,
  model: string,
  response: unknown,
  providerUsed?: string,
): Promise<void> {
  const normalized =
    "mode" in aiConfig ? toAiRequestConfig(aiConfig) : aiConfig;

  if (!isCacheEnabled() || normalized.provider === "mock") {
    return;
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const expiresAt = new Date(Date.now() + getCacheTtlMs(operation));

    await prisma.aiResponseCache.upsert({
      where: { id: fingerprint },
      create: {
        id: fingerprint,
        operation,
        provider: providerUsed ?? normalized.provider,
        model,
        inputHash: fingerprint,
        responseJson: response as object,
        expiresAt,
      },
      update: {
        responseJson: response as object,
        expiresAt,
        model,
        provider: providerUsed ?? normalized.provider,
      },
    });
  } catch {
    // Cache is best-effort; ignore DB failures.
  }
}

export function hashAnalysisSnapshot(analysis: {
  repository: { owner: string; name: string; defaultBranch: string };
  issues: { number: number; title: string }[];
  pullRequests: { number: number; title: string }[];
}): string {
  return createHash("sha256")
    .update(
      stableStringify({
        owner: analysis.repository.owner,
        name: analysis.repository.name,
        branch: analysis.repository.defaultBranch,
        issues: analysis.issues.map((issue) => [issue.number, issue.title]),
        pullRequests: analysis.pullRequests.map((pr) => [pr.number, pr.title]),
      }),
    )
    .digest("hex");
}

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
