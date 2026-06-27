import type { ActionRun, ActionRunCompletion } from "@/types/action-run";

export const ACTION_RUN_STORAGE_KEY = "maintaineros:action-run";

interface ActionRunStorageState {
  run: ActionRun;
  completion?: ActionRunCompletion;
}

export function saveActionRun(
  run: ActionRun,
  completion?: ActionRunCompletion,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const state: ActionRunStorageState = { run, completion };
  sessionStorage.setItem(ACTION_RUN_STORAGE_KEY, JSON.stringify(state));
}

function loadActionRunState(): ActionRunStorageState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(ACTION_RUN_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ActionRunStorageState | ActionRun;

    if ("run" in parsed) {
      return parsed;
    }

    return { run: parsed };
  } catch {
    return null;
  }
}

export function loadActiveActionRun(): ActionRun | null {
  return loadActionRunState()?.run ?? null;
}

export function loadActionRunCompletion(): ActionRunCompletion | null {
  return loadActionRunState()?.completion ?? null;
}

export function loadActionRun(id: string): ActionRun | null {
  const run = loadActiveActionRun();

  if (!run || run.id !== id) {
    return null;
  }

  return run;
}

export function clearActionRun(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(ACTION_RUN_STORAGE_KEY);
}

export function findActionRunForRepository(
  repositoryRef: string,
): ActionRun | null {
  const run = loadActiveActionRun();

  if (!run || run.repositoryRef !== repositoryRef) {
    return null;
  }

  return run;
}
