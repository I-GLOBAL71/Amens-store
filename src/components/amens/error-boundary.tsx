"use client";

// Error boundary des vues — si une vue plante (crash client, HMR instable),
// le header et le footer restent visibles et l'utilisateur obtient un message
// actionnable au lieu d'une page blanche.
import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  view: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // visible dans la console du navigateur / les logs dev
    console.error("[amens] erreur de vue :", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    // changer de vue re-tente un rendu propre
    if (prev.view !== this.props.view && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-primary" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold">Cette section n&apos;a pas pu s&apos;afficher</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Une erreur est survenue à l&apos;affichage (elle n&apos;affecte pas le reste du site).
            Recharge la page ou retourne à l&apos;accueil ; si le problème persiste, préviens-nous
            via le bouton WhatsApp en bas à droite.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => window.location.reload()} className="h-11">
              <RefreshCw className="mr-1 h-4 w-4" aria-hidden /> Recharger la page
            </Button>
            <Button variant="outline" className="h-11" onClick={() => this.setState({ error: null })}>
              Réessayer
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
