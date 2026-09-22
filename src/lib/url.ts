/**
 * Utility for generating assessment links across development, local network, and production environments.
 *
 * In browser environments, uses window.location.origin (e.g. "https://testora-sigma.vercel.app" in production).
 * In server/SSR environments, relies on process.env.NEXT_PUBLIC_APP_URL, defaulting to "http://localhost:3000".
 *
 * Ensures no extraneous ports like ":3000" are appended in production.
 */
export const getAssessmentUrl = (token: string, options: { isNew?: boolean } = {}): string => {
  const query = options.isNew ? '?new=1' : '';
  let origin = '';

  if (typeof window !== 'undefined' && window.location?.origin) {
    origin = window.location.origin;
  } else {
    origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  const cleanOrigin = origin.replace(/\/$/, '');
  return `${cleanOrigin}/assessment/${token}${query}`;
};
