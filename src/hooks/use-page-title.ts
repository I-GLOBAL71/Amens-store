"use client";

// Titre de page dynamique par vue (SPA à route unique) — optimisation
// invisible : chaque vue/article possède son <title>, pour les moteurs et les
// agents IA, sans rien afficher de plus côté visiteur.
import { useEffect } from "react";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
