/**
 * Pure ticket status transition helper.
 *
 * Extracted from actions.ts into its own module so it can be imported
 * without the 'use server' constraint (Next.js requires all exports from
 * a 'use server' file to be async functions).
 */

const TRANSITIONS: Record<string, string> = {
  open: 'in_progress',
  in_progress: 'closed',
};

/**
 * Returns true only for valid forward transitions:
 *   open → in_progress
 *   in_progress → closed
 *
 * All other combinations (backward, same-status, unknown) return false.
 *
 * Exported for property-based testing (Property 5).
 */
export function validateStatusTransition(current: string, requested: string): boolean {
  return TRANSITIONS[current] === requested;
}
