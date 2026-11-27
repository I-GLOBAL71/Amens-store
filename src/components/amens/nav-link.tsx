"use client";

import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNav } from "@/lib/store";
import { buildNavHref, type NavTarget } from "@/lib/nav";
import { prefetchArticle } from "@/hooks/use-amens";

/**
 * Lien hybride SSR + SPA : rend une vraie balise `<a href="/?v=…">` pour
 * les moteurs et agents IA sans JavaScript, tout en interceptant le clic normal
 * pour naviguer instantanément dans le store React (avec préchargement au survol/toucher).
 */
export function NavLink({
  target,
  children,
  className,
  ariaLabel,
  ariaCurrent,
  onNavigate,
}: {
  target: NavTarget;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaCurrent?: "page" | "step" | "location" | "date" | "time" | "true" | boolean;
  onNavigate?: () => void;
}) {
  const { navigate } = useNav();
  const qc = useQueryClient();

  const warm = () => {
    if (target.view === "article" && target.slug) {
      prefetchArticle(qc, target.slug);
    }
  };

  return (
    <a
      href={buildNavHref(target)}
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      onMouseEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
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
