const FILE_REFERENCE_PATTERN =
  /\b(?:LICENSE(?:\.md)?|[A-Za-z0-9_./-]+\.(?:md|txt|json|ya?ml|toml))\b/g;

const EDIT_VERB_PATTERN =
  /\b(?:update|modify|edit|change|fix|patch|rewrite|delete|remove|sync|align)\b/i;

function normalizeFileRef(ref: string): string {
  return ref.trim().toLowerCase();
}

/**
 * Returns the first out-of-scope file reference when text proposes editing
 * a file other than the plan target. Mentions for documentation are allowed.
 */
export function findOutOfScopeEditTarget(
  text: string,
  targetFile: string,
): string | null {
  const target = normalizeFileRef(targetFile);

  for (const match of text.matchAll(FILE_REFERENCE_PATTERN)) {
    const fileRef = match[0];
    if (normalizeFileRef(fileRef) === target) {
      continue;
    }

    const matchIndex = match.index ?? 0;
    const before = text.slice(Math.max(0, matchIndex - 80), matchIndex);
    if (EDIT_VERB_PATTERN.test(before)) {
      return fileRef;
    }
  }

  return null;
}
