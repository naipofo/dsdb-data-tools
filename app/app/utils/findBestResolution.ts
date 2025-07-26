import type { TokenResolutionLink } from "../DsdbManager";

export function findBestResolution(
  chain: TokenResolutionLink[],
  selectedContextTags: Set<string>
): TokenResolutionLink | undefined {
  let bestMatch: TokenResolutionLink | undefined = undefined;
  let highestScore = -1;

  for (const resolution of chain) {
    const resolutionTagNames = resolution.contextTags.map((t) => t.tagName);
    const isMatch = resolutionTagNames.every((tagName) =>
      selectedContextTags.has(tagName)
    );

    if (isMatch) {
      if (resolutionTagNames.length > highestScore) {
        highestScore = resolutionTagNames.length;
        bestMatch = resolution;
      }
    }
  }

  if (!bestMatch) {
    // Find the default resolution (no context tags) if no specific match was found.
    bestMatch = chain.find((r) => r.contextTags.length === 0);
  }

  return bestMatch;
}
