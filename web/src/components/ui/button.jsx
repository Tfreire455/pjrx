import React from "react";
import { cn } from "../../lib/cn";

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? "span" : "button";

  const variants = {
    primary: "bg-primary text-white hover:brightness-110",
    secondary: "bg-secondary/15 text-secondary border border-secondary/25 hover:bg-secondary/20",
    ghost: "bg-transparent hover:bg-white/5 border border-white/10",
    danger: "bg-danger text-white hover:brightness-110"
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base"
  };

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl transition will-change-transform",
        "shadow-soft/40 hover:-translate-y-0.5 active:translate-y-0",
        "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-0",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
