/**
 * Parses strings like "2h30m", "45m", "1h", "90m" into total seconds.
 * Returns null if the string doesn't match any recognized pattern.
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  const match = trimmed.match(/^(?:(\d+)h)?\s*(?:(\d+)m)?$/);
  if (!match) return null;

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  if (hours === 0 && minutes === 0) return null;

  return hours * 3600 + minutes * 60;
}

/** Formats a total number of seconds as "Xh Ym". */
export function formatDuration(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? "-" : "";
  const abs = Math.abs(totalSeconds);
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  return `${sign}${hours}h ${minutes}m`;
}
