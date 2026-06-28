"use client";

import { useEffect, useState } from "react";
import { getUserRepositoriesAction } from "@/actions/getUserRepositories";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

interface RepositoryOption {
  value: string;
  label: string;
}

interface RepositoryPickerProps {
  value: string;
  onSelect: (fullName: string) => void;
  disabled?: boolean;
  allowAnyRepository?: boolean;
}

export default function RepositoryPicker({
  value,
  onSelect,
  disabled = false,
  allowAnyRepository = false,
}: RepositoryPickerProps) {
  const [items, setItems] = useState<RepositoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(!allowAnyRepository);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (allowAnyRepository) {
      return;
    }

    let isCancelled = false;

    async function loadRepositories() {
      setIsLoading(true);
      setErrorMessage(null);

      const result = await getUserRepositoriesAction();

      if (isCancelled) {
        return;
      }

      if (result.success) {
        setItems(
          result.repositories.map((repository) => ({
            value: repository.full_name,
            label: repository.full_name,
          })),
        );
      } else {
        setErrorMessage(result.error.message);
      }

      setIsLoading(false);
    }

    void loadRepositories();

    return () => {
      isCancelled = true;
    };
  }, [allowAnyRepository]);

  if (allowAnyRepository) {
    return (
      <div className="space-y-1.5">
        <Input
          value={value}
          onChange={(event) => onSelect(event.target.value)}
          disabled={disabled}
          placeholder="owner/repo or github.com/owner/repo"
          className="h-8 w-full max-w-md border-white/[0.08] bg-secondary/50 font-mono text-xs placeholder:font-sans"
        />
        <p className="text-center text-[11px] text-muted-foreground">
          Dev login can analyze any public GitHub repository.
        </p>
      </div>
    );
  }

  const selectedItem =
    items.find((item) => item.value === value) ??
    (value ? { value, label: value } : null);

  if (isLoading) {
    return (
      <div className="flex h-8 w-full max-w-md items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-secondary/50 px-3 text-xs text-muted-foreground">
        <Spinner className="size-3.5" />
        Loading repositories…
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex h-8 w-full max-w-md items-center rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-xs text-destructive">
        {errorMessage}
      </div>
    );
  }

  return (
    <Combobox
      items={items}
      value={selectedItem}
      onValueChange={(nextValue) => {
        if (
          nextValue &&
          typeof nextValue === "object" &&
          "value" in nextValue &&
          typeof nextValue.value === "string"
        ) {
          onSelect(nextValue.value);
        }
      }}
      isItemEqualToValue={(item, selected) => item.value === selected.value}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder="Select repository"
        disabled={disabled}
        className="h-8 w-full max-w-md border-white/[0.08] bg-secondary/50 font-mono text-xs placeholder:font-sans"
      />
      <ComboboxContent>
        <ComboboxEmpty>No admin or maintain repositories found.</ComboboxEmpty>
        <ComboboxList>
          {(item: RepositoryOption) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
