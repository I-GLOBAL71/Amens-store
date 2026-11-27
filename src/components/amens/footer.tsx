"use client";

// Pied de page — sticky (mt-auto), disclosure d'affiliation §4.3 (obligation
// légale, reste visible), navigation vers les sujets + ressources utiles.
// robots.txt / llms.txt / sitemap.xml restent servis aux chemins standards,
// sans lien visible (optimisation invisible).
import { Ship } from "lucide-react";
import { ANGLES, DISCLOSURE } from "@/lib/pipeline/types";
import { useLead } from "@/hooks/use-amens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { NavLink } from "./nav-link";

export function Footer() {
  const lead = useLead();
  const { toast } = useToast();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 font-bold">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Ship className="h-5 w-5" aria-hidden />
              </span>
              amens<span className="text-primary">.store</span>
            </div>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Le guide francophone pour mettre en ligne tes projets IA, tes apps, ton site,
              ton email pro et ton business — même sans carte bancaire. Chaque hébergeur
              est testé avant d&apos;être recommandé.
            </p>
            <p className="mt-4 rounded-lg border border-amber-300/60 bg-accent/40 p-3 text-xs italic text-muted-foreground dark:border-amber-500/30">
              {DISCLOSURE}
            </p>
            <form
              className="mt-4 flex w-full max-w-sm flex-col gap-2 min-[380px]:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem("email") as HTMLInputElement;
                lead.mutate(
                  { type: "newsletter", contact: input.value, angle: 6 },
                  {
                    onSuccess: (r) => {
                      toast({ title: "Inscrit ✓", description: r.message });
                      input.value = "";
                    },
                    onError: (err) =>
                      toast({ title: "Erreur", description: err.message, variant: "destructive" }),
                  }
                );
              }}
            >
              <Input
                name="email"
                type="email"
                required
                placeholder="Newsletter — deals hébergement"
                aria-label="Email pour la newsletter deals"
                className="h-11 min-w-0 flex-1"
              />
              <Button type="submit" className="h-11 shrink-0" disabled={lead.isPending}>
                {lead.isPending ? "…" : "OK"}
              </Button>
            </form>
          </div>

          <nav aria-label="Guides par sujet" className="min-w-0">
            <h3 className="mb-2 sm:mb-3 text-sm font-semibold">Guides par sujet</h3>
            <ul className="space-y-0 sm:space-y-2 text-sm">
              {ANGLES.map((a) => (
                <li key={a.id}>
                  <NavLink
                    target={{ view: "blog", silo: a.silo }}
                    className="inline-flex min-h-[44px] sm:min-h-0 items-center py-1 text-muted-foreground hover:text-primary hover:underline"
                  >
                    /{a.silo}/ · {a.nom.split("(")[0]}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Ressources" className="min-w-0">
            <h3 className="mb-2 sm:mb-3 text-sm font-semibold">Ressources</h3>
            <ul className="space-y-0 sm:space-y-2 text-sm">
              <li>
                <NavLink
                  target={{ view: "labo" }}
                  className="inline-flex min-h-[44px] sm:min-h-0 items-center py-1 text-muted-foreground hover:text-primary hover:underline"
                >
                  Labo — mesures et méthodologie
                </NavLink>
              </li>
              <li>
                <NavLink
                  target={{ view: "outils" }}
                  className="inline-flex min-h-[44px] sm:min-h-0 items-center py-1 text-muted-foreground hover:text-primary hover:underline"
                >
                  Outils et calculateurs
                </NavLink>
              </li>
              <li>
                <NavLink
                  target={{ view: "promos" }}
                  className="inline-flex min-h-[44px] sm:min-h-0 items-center py-1 text-muted-foreground hover:text-primary hover:underline"
                >
                  Promos Black Friday
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 amens.store — guides testés, prix datés, données Labo.</p>
          <p>
            Mise à jour : novembre 2026 · Méthodologie Labo publique · Auteur : équipe amens
          </p>
        </div>
      </div>
    </footer>
  );
}
