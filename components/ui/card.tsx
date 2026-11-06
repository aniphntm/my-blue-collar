import * as React from "react";
import { cn } from "@/lib/utils";

/** Surface card: c-surface, hairline border, radius-card. Use `dark` for the c-panel inset. */
export function Card({
  className,
  dark = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { dark?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card border p-6",
        dark ? "border-panel-border bg-panel text-panel-text" : "border-border bg-surface",
        className,
      )}
      {...props}
    />
  );
}

export function CardEyebrow({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("eyebrow text-faint", className)} {...props} />;
}
