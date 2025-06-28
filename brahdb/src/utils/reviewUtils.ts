function getRatingColor(rating: number | null) {
  if (rating === null) return 'text-gray-400';
  if (rating >= 9.5) return 'font-bold text-yellow-300 drop-shadow-[0_0_6px_gold] animate-pulse';
  // Linear interpolate from red (1.0) to muted green (9.0)
  const min = 1, max = 9;
  const clamped = Math.max(min, Math.min(max, rating));
  const percent = (clamped - min) / (max - min);
  // Red to muted green: hsl(0,100%,50%) to hsl(120,60%,38%)
  const hue = 0 + percent * 120;
  const sat = 100 - percent * 40; // 100% to 60%
  const light = 50 - percent * 12; // 50% to 38%
  return `font-bold text-[hsl(${hue},${sat}%,${light}%)]`;
}

// Global cache for logo load/error state
const logoStatus: Record<string, 'loaded' | 'error' | undefined> = {};

export { getRatingColor, logoStatus };