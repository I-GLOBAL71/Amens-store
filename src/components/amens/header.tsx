"use client";

// En-tête — navigation entre les sections (accès direct aux sujets via Blog)
import { useState } from "react";
import { Menu, Moon, Sun, Ship } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useNav } from "@/lib/store";
import type { ViewName } from "@/lib/pipeline/types";

const LINKS: { view: ViewName; label: string }[] = [
  { view: "home", label: "Accueil" },
  { view: "blog", label: "Blog" },
  { view: "outils", label: "Outils" },
  { view: "labo", label: "Labo" },
  { view: "promos", label: "Promos" },
];

export function Header() {
  const { view, navigate } = useNav();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-2">
          <button
            aria-label="amens.store — accueil"
            className="flex items-center gap-2 font-bold tracking-tight text-foreground"
            onClick={() => navigate({ view: "home" })}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Ship className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg">
              amens<span className="text-primary">.store</span>
            </span>
          </button>

          <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => (
              <button
                key={l.view}
                onClick={() => navigate({ view: l.view })}
                aria-current={view === l.view ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  view === l.view
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                }`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Basculer entre mode clair et mode sombre"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 dark:hidden" aria-hidden />
              <Moon className="hidden h-5 w-5 dark:block" aria-hidden />
            </Button>
            <button
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border"
              aria-label="Ouvrir le menu"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {open && (
          <nav aria-label="Navigation mobile" className="md:hidden pb-3">
            <div className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <button
                  key={l.view}
                  onClick={() => {
                    navigate({ view: l.view });
                    setOpen(false);
                  }}
                  className={`rounded-lg px-3 py-3 text-left text-base font-medium ${
                    view === l.view
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
