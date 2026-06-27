"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PreviewListDialogProps<T> {
  items: T[];
  previewCount?: number;
  renderItem: (item: T, index: number) => ReactNode;
  dialogTitle: string;
  emptyMessage?: string;
  getItemKey?: (item: T, index: number) => string;
  listClassName?: string;
}

export function PreviewListDialog<T>({
  items,
  previewCount = 3,
  renderItem,
  dialogTitle,
  emptyMessage = "No items to show.",
  getItemKey,
  listClassName = "space-y-2.5",
}: PreviewListDialogProps<T>) {
  const [open, setOpen] = useState(false);
  const previewItems = items.slice(0, previewCount);
  const remainingCount = Math.max(items.length - previewCount, 0);

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <>
      <div className={listClassName}>
        {previewItems.map((item, index) => (
          <div key={getItemKey?.(item, index) ?? index}>{renderItem(item, index)}</div>
        ))}
      </div>

      {remainingCount > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(true)}
        >
          Load more ({remainingCount})
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className={cn(listClassName, "max-h-[60vh] overflow-y-auto pr-1")}>
            {items.map((item, index) => (
              <div key={getItemKey?.(item, index) ?? index}>{renderItem(item, index)}</div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
