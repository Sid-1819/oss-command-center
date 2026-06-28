"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import type { z } from "zod";

interface UseAiStreamOptions<TSchema extends z.ZodType> {
  api: string;
  schema: TSchema;
  onFinish?: (event: {
    object: z.infer<TSchema> | undefined;
    error: Error | undefined;
  }) => void | Promise<void>;
  onError?: (error: Error) => void;
}

export function useAiStream<TSchema extends z.ZodType>({
  api,
  schema,
  onFinish,
  onError,
}: UseAiStreamOptions<TSchema>) {
  return useObject({
    api,
    schema,
    onFinish,
    onError,
  });
}

export { useObject };
