"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  BYOK_PROVIDER_OPTIONS,
  DEV_DEMO_PROVIDER_OPTION,
  HOSTED_PROVIDER_OPTION,
  getDefaultByokProvider,
} from "@/lib/ai/provider-catalog";
import {
  aiConfigLabel,
  getDefaultModelForProviderOption,
  getEffectiveAiConfig,
  isLocalDevAiTestingEnabled,
  loadAiConfig,
  saveAiConfig,
  usesOwnProviderKey,
  type ByokProviderId,
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
import { Switch } from "@/components/ui/switch";

interface AiSettingsSheetProps {
  onSaved?: (config: StoredAiConfig) => void;
}

export default function AiSettingsSheet({ onSaved }: AiSettingsSheetProps) {
  const [open, setOpen] = useState(false);
  const [useOwnKey, setUseOwnKey] = useState(false);
  const [hostedSource, setHostedSource] = useState<AiProviderId>("auto");
  const [byokProvider, setByokProvider] = useState<ByokProviderId>(getDefaultByokProvider());
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [statusLabel, setStatusLabel] = useState("MaintainerOS AI");

  const showDevOptions = isLocalDevAiTestingEnabled();

  useEffect(() => {
    const config = getEffectiveAiConfig();
    const ownKey = usesOwnProviderKey(config);

    setUseOwnKey(ownKey);

    if (ownKey && config.provider !== "auto" && config.provider !== "mock") {
      setByokProvider(config.provider as ByokProviderId);
    } else {
      setHostedSource(config.provider === "mock" ? "mock" : "auto");
    }

    setApiKey(config.apiKey ?? "");
    setModel(config.model ?? "");
    setStatusLabel(aiConfigLabel(config));
  }, [open]);

  function handleSave() {
    let stored: StoredAiConfig;

    if (useOwnKey) {
      stored = saveAiConfig({
        provider: byokProvider,
        apiKey: apiKey.trim() || undefined,
        model: model.trim() || undefined,
      });
    } else {
      stored = saveAiConfig({
        provider: hostedSource,
        model: undefined,
        apiKey: undefined,
      });
    }

    setStatusLabel(aiConfigLabel(stored));
    onSaved?.(stored);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="size-3.5" />
          MaintainerOS AI
          <Badge variant="secondary" className="ml-0.5 hidden max-w-40 truncate sm:inline-flex">
            {statusLabel}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            MaintainerOS AI
          </SheetTitle>
          <SheetDescription>
            Production uses hosted MaintainerOS AI with free Gemini and OpenRouter models — no
            setup required. Switch to your own provider only if you want to bring an API key.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 py-2">
          {!useOwnKey ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">MaintainerOS AI</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {HOSTED_PROVIDER_OPTION.description}
              </p>
            </div>
          ) : null}

          {showDevOptions && !useOwnKey ? (
            <div className="space-y-2">
              <Label htmlFor="ai-dev-source">Local development</Label>
              <Select
                value={hostedSource}
                onValueChange={(value) => setHostedSource(value as AiProviderId)}
              >
                <SelectTrigger id="ai-dev-source" className="w-full">
                  <SelectValue placeholder="Select development mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={HOSTED_PROVIDER_OPTION.id}>
                    {HOSTED_PROVIDER_OPTION.label}
                  </SelectItem>
                  <SelectItem value={DEV_DEMO_PROVIDER_OPTION.id}>
                    {DEV_DEMO_PROVIDER_OPTION.label}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {hostedSource === "mock"
                  ? DEV_DEMO_PROVIDER_OPTION.description
                  : "Use hosted models while developing locally (requires server API keys)."}
              </p>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/40 p-4">
            <div className="space-y-1">
              <Label htmlFor="ai-use-own-key" className="text-sm font-medium">
                Use my own provider
              </Label>
              <p className="text-xs text-muted-foreground">
                Optional. Connect OpenAI, Anthropic, Gemini, Groq, or another supported provider
                with your API key.
              </p>
            </div>
            <Switch
              id="ai-use-own-key"
              checked={useOwnKey}
              onCheckedChange={(checked) => {
                setUseOwnKey(checked);
                if (checked) {
                  setByokProvider(getDefaultByokProvider());
                }
              }}
            />
          </div>

          {useOwnKey ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="ai-byok-provider">Provider</Label>
                <Select
                  value={byokProvider}
                  onValueChange={(value) => setByokProvider(value as ByokProviderId)}
                >
                  <SelectTrigger id="ai-byok-provider" className="w-full">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {BYOK_PROVIDER_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-api-key">API key</Label>
                <Input
                  id="ai-api-key"
                  type="password"
                  autoComplete="off"
                  placeholder="Paste your provider API key"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-model">Model override (optional)</Label>
                <Input
                  id="ai-model"
                  placeholder={
                    getDefaultModelForProviderOption(byokProvider) ?? "Default model for provider"
                  }
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                />
              </div>
            </>
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
