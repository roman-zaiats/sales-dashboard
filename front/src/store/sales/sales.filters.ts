const normalizeTagFilterInput = (value: string): string => {
  return value.trim().replace(/\s+/g, ' ');
};

export const normalizeTagFilters = (tagFilters: string[] | undefined): string[] => {
  if (!tagFilters || tagFilters.length === 0) {
    return [];
  }

  const normalized = new Map<string, string>();

  for (const rawTag of tagFilters) {
    const trimmed = normalizeTagFilterInput(rawTag);

    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (!normalized.has(key)) {
      normalized.set(key, trimmed);
    }
  }

  return [...normalized.values()];
};
