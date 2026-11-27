"use client";

// En-tête — navigation entre les sections (accès direct aux sujets via Blog)
import { useEffect, useState } from "react";
import { Menu, Moon, Sun, Ship, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useNav } from "@/lib/store";
import type { ViewName } from "@/lib/pipeline/types";
import { NavLink } from "./nav-link";

const LINKS: { view: ViewName; label: string }[] = [
  { view: "home", label: "Accueil" },
  { view: "blog", label: "Blog" },
  { view: "outils", label: "Outils" },
  { view: "labo", label: "Labo" },
  { view: "promos", label: "Promos" },
];

export function Header() {
  const { view } = useNav();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-2">
          <NavLink
            target={{ view: "home" }}
            ariaLabel="amens.store — accueil"
            onNavigate={() => setOpen(false)}
            className="flex min-w-0 items-center gap-2 font-bold tracking-tight text-foreground"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Ship className="h-5 w-5" aria-hidden />
            </span>
            <span className="truncate text-lg">
              amens<span className="text-primary">.store</span>
            </span>
          </NavLink>

          <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.view}
                target={{ view: l.view }}
                ariaCurrent={view === l.view ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  view === l.view
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                }`}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 md:h-9 md:w-9"
              aria-label="Basculer entre mode clair et mode sombre"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 dark:hidden" aria-hidden />
              <Moon className="hidden h-5 w-5 dark:block" aria-hidden />
            </Button>
            <button
              type="button"
              className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-secondary"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>

        {open && (
          <nav aria-label="Navigation mobile" className="md:hidden border-t border-border/60 py-3">
            <div className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <NavLink
                  key={l.view}
                  target={{ view: l.view }}
                  ariaCurrent={view === l.view ? "page" : undefined}
                  onNavigate={() => setOpen(false)}
                  className={`flex min-h-[48px] items-center rounded-lg px-3.5 py-3 text-left text-base font-medium transition-colors ${
                    view === l.view
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  }`}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
