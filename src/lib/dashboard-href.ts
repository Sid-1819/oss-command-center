export function getDashboardHref(
  repositoryRef?: string,
  options?: { demoMode?: boolean },
): string {
  const base = options?.demoMode ? "/app/demo" : "/app";
  const trimmed = repositoryRef?.trim();

  if (!trimmed) {
    return base;
  }

  return `${base}?repo=${encodeURIComponent(trimmed)}`;
}
