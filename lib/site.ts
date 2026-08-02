/**
 * Public address of the deployed site.
 *
 * Share links must always point here — never at window.location.origin,
 * which is localhost while developing and would hand out a link nobody
 * else can open.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rolling-ppippo.vercel.app";

/**
 * The planet the landing page shows off. Point this at a planet with a
 * decent crowd of messages — an empty one makes the pitch worse, not
 * better.
 */
export const DEMO_SLUG = process.env.NEXT_PUBLIC_DEMO_SLUG ?? "6b5767ba";

export function planetUrl(slug: string) {
  return `${SITE_URL}/${encodeURIComponent(slug)}`;
}
