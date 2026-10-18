import { ROLE_LABEL } from "@/lib/format";

export function RoleBadge({ role }: { role: keyof typeof ROLE_LABEL }) {
  const tone =
    role === "owner"
      ? "bg-ink text-paper"
      : role === "editor"
        ? "bg-accent-soft text-accent"
        : "bg-canvas text-ink-muted";
  return (
    <span className={`inline-block rounded-sm px-1.5 py-0.5 text-xs font-medium leading-4 ${tone}`}>
      {ROLE_LABEL[role]}
    </span>
  );
}
