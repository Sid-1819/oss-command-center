"use client";

import { useEffect, useState } from "react";
import { KeyRound, Sparkles } from "lucide-react";
import {
  aiConfigLabel,
  getEffectiveAiConfig,
  isServerAiConfigured,
  loadAiConfig,
  saveAiConfig,
  type StoredAiConfig,
} from "@/lib/ai/client-settings";
import type { AiProviderId } from "@/lib/ai/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const PROVIDER_OPTIONS: {
  id: AiProviderId;
  label: string;
  docsUrl?: string;
  requiresKey: boolean;
}[] = [
  {
    id: "mock",
    label: "Mock (no API key)",
    requiresKey: false,
  },
  {
    id: "auto",
    label: "Server AI (automatic failover)",
    requiresKey: false,
  },
  {
    id: "gemini",
    label: "Google Gemini (BYOK)",
    docsUrl: "https://ai.google.dev/gemini-api/docs/api-key",
    requiresKey: true,
  },
  {
    id: "openrouter",
    label: "OpenRouter (BYOK)",
    docsUrl: "https://openrouter.ai/keys",
    requiresKey: true,
  },
];

const MODEL_PLACEHOLDERS: Partial<Record<AiProviderId, string>> = {
  gemini: "gemini-2.5-flash",
  openrouter: "openrouter/free",
};

interface AiSettingsSheetProps {
  onSaved?: (config: StoredAiConfig) => void;
}

export default function AiSettingsSheet({ onSaved }: AiSettingsSheetProps) {
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<AiProviderId>("mock");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [statusLabel, setStatusLabel] = useState("Mock data");

  useEffect(() => {
    const config = getEffectiveAiConfig();
    setProvider(config.provider);
    setApiKey(config.apiKey ?? "");
    setModel(config.model ?? "");
    setStatusLabel(aiConfigLabel(config));
  }, [open]);

  function handleSave() {
    const stored = saveAiConfig({
      provider,
      apiKey: apiKey.trim() || undefined,
      model: model.trim() || undefined,
    });

    setStatusLabel(aiConfigLabel(stored));
    onSaved?.(stored);
    setOpen(false);
  }

  const selectedProvider = PROVIDER_OPTIONS.find((option) => option.id === provider);
  const showKeyFields = provider !== "mock" && provider !== "auto";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <KeyRound className="size-3.5" />
          AI
          <Badge variant="secondary" className="ml-0.5 hidden sm:inline-flex">
            {statusLabel}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            AI settings
          </SheetTitle>
          <SheetDescription>
            By default, hosted deployments use server-side keys with automatic
            Gemini → OpenRouter failover. Override with your own key below.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 py-2">
          {isServerAiConfigured() ? (
            <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
              Server AI is configured. Select &quot;Server AI&quot; to use automatic
              provider failover, or pick a BYOK provider to override.
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="ai-provider">Provider</Label>
            <Select
              value={provider}
              onValueChange={(value) => setProvider(value as AiProviderId)}
            >
              <SelectTrigger id="ai-provider" className="w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {provider === "auto" ? (
            <p className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
              Uses server environment keys with automatic failover: Gemini 2.5 Flash
              → OpenRouter free.
            </p>
          ) : null}

          {showKeyFields ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="ai-api-key">API key</Label>
                <Input
                  id="ai-api-key"
                  type="password"
                  autoComplete="off"
                  placeholder="Paste your API key"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-model">Model override (optional)</Label>
                <Input
                  id="ai-model"
                  placeholder={MODEL_PLACEHOLDERS[provider] ?? "Default model"}
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                />
              </div>

              {selectedProvider?.docsUrl ? (
                <p className="text-xs text-muted-foreground">
                  Get a key from{" "}
                  <a
                    href={selectedProvider.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {selectedProvider.label.replace(" (BYOK)", "")}
                  </a>
                  .
                </p>
              ) : null}
            </>
          ) : null}

          {provider === "mock" ? (
            <p className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
              Mock mode returns fixture data for analysis, planning, and demo PR flows —
              ideal for local development without spending API quota.
            </p>
          ) : null}
        </div>

        <SheetFooter className="px-4">
          <Button onClick={handleSave} className="w-full">
            Save settings
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function useAiConfig(): StoredAiConfig | null {
  const [config, setConfig] = useState<StoredAiConfig | null>(null);

  useEffect(() => {
    setConfig(loadAiConfig());
  }, []);

  return config;
}
