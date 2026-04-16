export function normalizeNonNegativeInt(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function normalizeNonNegativeIntOrDefault(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return normalizeNonNegativeInt(fallback);
  }

  return normalizeNonNegativeInt(value);
}
