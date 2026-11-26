"use client";

import type { ReactNode } from "react";
import { useNav } from "@/lib/store";
import { buildNavHref, type NavTarget } from "@/lib/nav";

/**
 * Lien hybride SSR + SPA : rend une vraie balise `<a href="/?v=…">` pour
 * les moteurs et agents IA sans JavaScript, tout en interceptant le clic normal
 * pour naviguer instantanément dans le store React.
 */
export function NavLink({
  target,
  children,
  className,
  ariaLabel,
  ariaCurrent,
  ariaPressed,
  onNavigate,
}: {
  target: NavTarget;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaCurrent?: "page" | "step" | "location" | "date" | "time" | boolean;
  ariaPressed?: boolean;
  onNavigate?: () => void;
}) {
  const { navigate } = useNav();

  return (
    <a
      href={buildNavHref(target)}
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      aria-pressed={ariaPressed}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(target);
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}
