"use client";

// Hooks de données (TanStack Query) — serveur d'état de la plateforme.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ArticleDTO,
  ProgramDTO,
  SkillDTO,
  LaboFull,
  PipelineResult,
  KeywordRow,
  PipelineStepResult,
  ArticleDetailPayload,
} from "@/lib/pipeline/types";

export interface SkillExtended extends SkillDTO {
  installed: boolean;
  stats: { passed: number; warned: number; blocked: number };
}

// LaboExtended : forme renvoyée par /api/labo et par l'injection SSR (LaboFull).
export type LaboExtended = LaboFull;

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erreur ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function useArticles(params: { silo?: string | null; status?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.silo) qs.set("silo", params.silo);
  if (params.status) qs.set("status", params.status);
  return useQuery({
    queryKey: ["articles", params.silo ?? "all", params.status ?? "published"],
    queryFn: () =>
      j<{ articles: ArticleDTO[]; siloCounts: { silo: string; count: number }[] }>(
        `/api/articles${qs.toString() ? "?" + qs.toString() : ""}`
      ),
  });
}

export function useArticle(slug: string | null) {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: () => j<ArticleDetailPayload>(`/api/articles/${encodeURIComponent(slug!)}`),
    enabled: !!slug,
  });
}

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: () =>
      j<{ skills: SkillExtended[]; pipelinePath: string }>("/api/skills"),
  });
}

export function usePrograms(
  params: { angle?: number; context?: string; geo?: string; enabled?: boolean } = {}
) {
  const qs = new URLSearchParams();
  if (params.angle) qs.set("angle", String(params.angle));
  if (params.context) qs.set("context", params.context);
  if (params.geo) qs.set("geo", params.geo);
  return useQuery({
    queryKey: ["programs", { angle: params.angle, context: params.context, geo: params.geo }],
    queryFn: () =>
      j<{ programs: (ProgramDTO & { trackingUrl: string })[] }>(
        `/api/programs${qs.toString() ? "?" + qs.toString() : ""}`
      ),
    enabled: params.enabled ?? true,
  });
}

export function useLabo() {
  return useQuery({
    queryKey: ["labo"],
    queryFn: () => j<LaboExtended>("/api/labo"),
  });
}

export function useRuns(limit = 20) {
  return useQuery({
    queryKey: ["runs", limit],
    queryFn: () =>
      j<{
        runs: {
          id: string;
          runType: string;
          status: string;
          angle: number;
          requete: string;
          title: string;
          blockingIssues: number;
          warnings: number;
          overallScore: number;
          steps: { skillSlug: string; status: string; score?: number; summary: string }[];
          createdAt: string;
        }[];
      }>(`/api/pipeline/runs?limit=${limit}`),
  });
}

export function useKeywords(angle?: number) {
  return useQuery({
    queryKey: ["keywords", angle ?? 0],
    queryFn: () =>
      j<{ rows: KeywordRow[] }>(
        `/api/keywords${angle ? "?angle=" + angle : ""}`
      ),
  });
}

export function usePipelineAnalyze() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      angle: number;
      requete: string;
      title: string;
      content: string;
      metaTitle?: string;
      metaDescription?: string;
    }) =>
      j<{ pipeline: PipelineResult }>("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["runs"] });
    },
  });
}

export function usePublishArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      angle: number;
      requete: string;
      title: string;
      content: string;
      metaTitle?: string;
      metaDescription?: string;
      difficulty?: string;
      timeEstimate?: string;
      costEstimate?: string;
    }) =>
      j<{
        article: ArticleDTO;
        pipeline: PipelineResult;
        message: string;
      }>("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["runs"] });
      qc.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}

export function useKeywordResearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { graine: string; angle: number; programme?: string }) =>
      j<{
        result: {
          source: string;
          rows: KeywordRow[];
          cibler: number;
          surveiller: number;
          ignorer: number;
          note: string;
        };
      }>("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["keywords"] });
    },
  });
}

export function useLead() {
  return useMutation({
    mutationFn: (payload: { type: string; contact: string; angle?: number; message?: string }) =>
      j<{ ok: boolean; message: string }>("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
  });
}

export type { PipelineStepResult };
