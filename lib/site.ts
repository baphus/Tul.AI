/** The public production origin used for canonical URLs and crawler metadata. */
export const SITE_URL = new URL("https://tul.ai");

export function siteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
