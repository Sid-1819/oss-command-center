"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  BYOK_PROVIDER_OPTIONS,
  HOSTED_PROVIDER_OPTION,
  getDefaultByokProvider,
} from "@/lib/ai/provider-catalog";
import {
  aiConfigLabel,
  getDefaultModelForProviderOption,
  getEffectiveAiConfig,
  loadAiConfig,
  saveAiConfig,
  usesOwnProviderKey,
  type ByokProviderId,
  type StoredAiConfig,
} from "@/lib/ai/client-settings";
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
  const [byokProvider, setByokProvider] = useState<ByokProviderId>(getDefaultByokProvider());
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [statusLabel, setStatusLabel] = useState("MaintainerOS AI");

  useEffect(() => {
    const config = getEffectiveAiConfig();
    const ownKey = usesOwnProviderKey(config);

    setUseOwnKey(ownKey);

    if (ownKey && config.provider !== "auto") {
      setByokProvider(config.provider as ByokProviderId);
    }

    setApiKey(config.apiKey ?? "");
    setModel(config.model ?? "");
    setStatusLabel(aiConfigLabel(config));
  }, [open]);

  function handleSave() {
    const stored = useOwnKey
      ? saveAiConfig({
          provider: byokProvider,
          apiKey: apiKey.trim() || undefined,
          model: model.trim() || undefined,
        })
      : saveAiConfig({
          provider: "auto",
          model: undefined,
          apiKey: undefined,
        });

    setStatusLabel(aiConfigLabel(stored));
    onSaved?.(stored);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={`AI settings: ${statusLabel}`}
        >
          <Sparkles className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            MaintainerOS AI
          </SheetTitle>
          <SheetDescription>
            Hosted MaintainerOS AI uses free Gemini and OpenRouter models with automatic
            failover — no setup required.
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

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/40 p-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="ai-use-own-key" className="text-sm font-medium">
                  Use your own provider
                </Label>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                  Experimental
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Connect OpenAI, Anthropic, Gemini, Groq, or another supported provider with
                your API key.
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
