"use client";

// Bouton WhatsApp flottant « On le fait pour toi » (cahier §9.1).
// Se masque automatiquement quand le footer entre dans le viewport : jamais
// au-dessus du copyright/newsletter en bas de page (desktop comme mobile).
import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useLead } from "@/hooks/use-amens";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function WhatsappFloat() {
  const [open, setOpen] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const lead = useLead();
  const { toast } = useToast();

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const obs = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.12 }
    );
    obs.observe(footer);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Pack WhatsApp — On le fait pour toi"
          className="fixed bottom-24 right-4 z-50 w-[min(92vw,340px)] rounded-xl border border-border bg-card p-4 shadow-xl"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">On le fait pour toi</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Hébergement + mise en ligne + email pro, payé en Mobile Money
                (Orange Money, MTN MoMo, Wave). Marge équitable, aucune carte
                bancaire demandée.
              </p>
            </div>
            <button aria-label="Fermer" onClick={() => setOpen(false)} className="text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const contact = (form.elements.namedItem("wa") as HTMLInputElement).value;
              const message = (form.elements.namedItem("msg") as HTMLTextAreaElement).value;
              lead.mutate(
                { type: "whatsapp", contact, angle: 3, message },
                {
                  onSuccess: (r) => {
                    toast({ title: "Demande enregistrée", description: r.message });
                    setOpen(false);
                  },
                  onError: (err) =>
                    toast({ title: "Erreur", description: err.message, variant: "destructive" }),
                }
              );
            }}
          >
            <Input
              name="wa"
              required
              placeholder="Ton numéro WhatsApp"
              aria-label="Numéro WhatsApp"
              className="h-11"
            />
            <Textarea
              name="msg"
              rows={2}
              placeholder="Ton projet (ex. site école, app n8n…)"
              aria-label="Description du projet"
            />
            <Button type="submit" className="h-11 w-full" disabled={lead.isPending}>
              {lead.isPending ? "Envoi…" : "Être recontacté"}
            </Button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Pack WhatsApp — On le fait pour toi (Mobile Money)"
        aria-hidden={footerVisible && !open}
        className={`fixed bottom-5 right-5 z-50 flex h-14 items-center gap-2 rounded-full bg-primary px-4 text-primary-foreground shadow-lg transition-all duration-300 sm:px-5 ${
          footerVisible && !open
            ? "pointer-events-none translate-y-4 opacity-0"
            : "opacity-100 hover:scale-105"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
        <span className="hidden text-sm font-semibold sm:inline">On le fait pour toi</span>
      </button>
    </>
  );
}
