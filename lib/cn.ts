export type ClassValue = string | false | null | undefined

/** Tiny class joiner — avoids pulling in a dependency for this. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
