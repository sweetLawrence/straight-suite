/**
 * Menu names carry the cooking choices in brackets, e.g.
 * "1 Broiler (Wet fry/dry fry/choma)". These helpers split that apart so the
 * waiter picks one style and the kitchen sees only the one chosen.
 */

const OPTIONS_RE = /\s*\(([^()]*\/[^()]*)\)\s*$/

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** ["Wet fry", "Dry fry", "Choma"], or [] when the item has no choices */
export function cookingStyles (name: string): string[] {
  const m = String(name || '').match(OPTIONS_RE)
  if (!m) return []
  return m[1]
    .split('/')
    .map(s => cap(s.trim()))
    .filter(Boolean)
}

/** "1 Broiler (Wet fry/dry fry/choma)" → "1 Broiler" */
export function menuBaseName (name: string): string {
  return String(name || '')
    .replace(OPTIONS_RE, '')
    .trim()
}

/** Pull "Style: Dry fry" out of line notes, leaving the rest */
export function splitStyle (notes?: string | null): {
  style: string | null
  rest: string
} {
  const parts = String(notes || '')
    .split(' · ')
    .map(p => p.trim())
    .filter(Boolean)
  const i = parts.findIndex(p => /^style:/i.test(p))
  if (i === -1) return { style: null, rest: parts.join(' · ') }
  const style = parts[i].replace(/^style:\s*/i, '')
  parts.splice(i, 1)
  return { style, rest: parts.join(' · ') }
}

/**
 * Kitchen-facing name: base name plus the chosen style, e.g. "1 Broiler - Dry fry".
 * Falls back to the full menu name when no style was chosen (older orders).
 */
export function kitchenName (
  name: string,
  notes?: string | null
): { name: string; style: string | null; rest: string } {
  const { style, rest } = splitStyle(notes)
  return { name: style ? menuBaseName(name) : name, style, rest }
}
