/** "just now", "4 min ago", "2 h ago", "yesterday", "12 Mar". */
export function timeAgo(date: Date | string, now = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const sec = Math.round((now.getTime() - d.getTime()) / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day} days ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export const ROLE_LABEL = {
  owner: "Owner",
  editor: "Can edit",
  viewer: "Can view",
} as const;
