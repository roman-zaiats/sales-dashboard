export type SortComparator<T> = (left: T, right: T) => number;

export function stableSort<T>(
  items: readonly T[],
  comparator: SortComparator<T>
): T[] {
  return [...items].sort(comparator);
}

export function clampIndex(index: number, max: number): number {
  if (!Number.isFinite(index)) {
    return 0;
  }

  if (index < 0) {
    return 0;
  }

  if (index >= max) {
    return Math.max(0, max - 1);
  }

  return index;
}
