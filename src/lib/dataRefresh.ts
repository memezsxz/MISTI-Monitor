export const DEFAULT_CACHE_WINDOW_MS = 3000;

/**
 * Returns the standard interval (in ms) used for polling/cached fetches.
 * Pass a multiplier to speed up or slow down as needed.
 */
export function getCacheWindowMs(multiplier = 1): number {
    return Math.max(0, Math.round(DEFAULT_CACHE_WINDOW_MS * multiplier));
}
