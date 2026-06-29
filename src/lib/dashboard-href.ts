export function getDashboardHref(repositoryRef?: string): string {
  const base = "/app";
  const trimmed = repositoryRef?.trim();

  if (!trimmed) {
    return base;
  }

  return `${base}?repo=${encodeURIComponent(trimmed)}`;
}
