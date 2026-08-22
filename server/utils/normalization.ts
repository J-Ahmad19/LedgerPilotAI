export function normalizeString(str: string | null | undefined): string | null {
  if (!str) return null;
  return str.trim().toUpperCase().replace(/\s+/g, " ");
}

export function normalizeReference(ref: string | null | undefined): string | null {
  if (!ref) return null;
  return ref.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
