/**
 * Shared navigation helpers for matching the current URL against nav link URLs.
 *
 * Both helpers receive the current pathname and search params so they stay
 * framework-agnostic and easy to unit-test.
 */

/** Exact match — only returns true when the full path + query params match. */
export function isNavActive(
  pathname: string,
  searchParams: URLSearchParams,
  url: string
): boolean {
  if (url === '#') return false;
  const [targetPath, targetQuery] = url.split('?');

  // Exact path match required — prefix match intentionally excluded
  if (pathname !== targetPath) return false;

  // No query in the nav link → path match alone is sufficient
  if (!targetQuery) return true;

  // Nav link has query params → all must match
  const targetParams = new URLSearchParams(targetQuery);
  return Array.from(targetParams.entries()).every(
    ([key, value]) => searchParams.get(key) === value
  );
}

/**
 * Prefix match — returns true when the pathname is the target path or a
 * child of it (e.g. `/tenders/create` matches `/tenders`).
 * Used for collapsible expansion so the group opens when the user is
 * anywhere in that section.
 */
export function isPathInSection(pathname: string, url: string): boolean {
  const targetPath = url.split('?')[0];
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}
