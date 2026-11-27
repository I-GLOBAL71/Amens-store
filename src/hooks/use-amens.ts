"use client";

// Hooks de données (TanStack Query) — serveur d'état de la plateforme.
import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  ArticleDTO,
  ProgramDTO,
  SkillDTO,
  LaboFull,
  PipelineResult,
  KeywordRow,
  PipelineStepResult,
  ArticleDetailPayload,
  InitialArticlesPayload,
} from "@/lib/pipeline/types";
import {
  buildCachedArticleDetail,
  filterCachedArticlesBySilo,
  filterCachedPrograms,
} from "@/lib/cache-helpers";

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
  const qc = useQueryClient();
  const qs = new URLSearchParams();
  if (params.silo) qs.set("silo", params.silo);
  if (params.status) qs.set("status", params.status);
  const status = params.status ?? "published";
  const allState = status === "published" ? qc.getQueryState<InitialArticlesPayload>(["articles", "all", "published"]) : undefined;
  const allData = allState?.data;
  const canUseAsInitial = Boolean(params.silo && allData && allData.articles.length < 100);

  return useQuery({
    queryKey: ["articles", params.silo ?? "all", status],
    queryFn: () =>
      j<{ articles: ArticleDTO[]; siloCounts: { silo: string; count: number }[] }>(
        `/api/articles${qs.toString() ? "?" + qs.toString() : ""}`
      ),
    initialData: canUseAsInitial ? () => filterCachedArticlesBySilo(allData, params.silo) : undefined,
    initialDataUpdatedAt: canUseAsInitial ? allState?.dataUpdatedAt : undefined,
    placeholderData:
      params.silo && !canUseAsInitial && allData
        ? () => filterCachedArticlesBySilo(allData, params.silo)
        : undefined,
  });
}

export function useArticle(slug: string | null) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["article", slug],
    queryFn: () => j<ArticleDetailPayload>(`/api/articles/${encodeURIComponent(slug!)}`),
    enabled: !!slug,
    placeholderData: () => {
      if (!slug) return undefined;
      const allArticles = qc.getQueryData<InitialArticlesPayload>(["articles", "all", "published"]);
      let pool = allArticles?.articles ?? [];
      if (pool.length === 0) {
        const anyCached = qc.getQueriesData<InitialArticlesPayload>({ queryKey: ["articles"] });
        pool = anyCached.flatMap(([, payload]) => payload?.articles ?? []);
      }
      const programsPool = qc.getQueryData<ProgramDTO[]>(["programs", "raw"]) ?? [];
      return buildCachedArticleDetail(slug, pool, programsPool);
    },
  });
}

/** Précharge un article dans le cache TanStack au survol ou au toucher. */
export function prefetchArticle(qc: QueryClient, slug: string) {
  if (!slug) return;
  const existing = qc.getQueryState(["article", slug]);
  if (existing?.data && Date.now() - existing.dataUpdatedAt < 30_000) return;
  void qc.prefetchQuery({
    queryKey: ["article", slug],
    queryFn: () => j<ArticleDetailPayload>(`/api/articles/${encodeURIComponent(slug)}`),
    staleTime: 30_000,
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
  const qc = useQueryClient();
  const qs = new URLSearchParams();
  if (params.angle) qs.set("angle", String(params.angle));
  if (params.context) qs.set("context", params.context);
  if (params.geo) qs.set("geo", params.geo);
  const rawState = qc.getQueryState<ProgramDTO[]>(["programs", "raw"]);
  const rawPrograms = rawState?.data;

  return useQuery({
    queryKey: ["programs", { angle: params.angle, context: params.context, geo: params.geo }],
    queryFn: () =>
      j<{ programs: (ProgramDTO & { trackingUrl: string })[] }>(
        `/api/programs${qs.toString() ? "?" + qs.toString() : ""}`
      ),
    initialData: rawPrograms ? () => filterCachedPrograms(rawPrograms, params) : undefined,
    initialDataUpdatedAt: rawPrograms ? rawState?.dataUpdatedAt : undefined,
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

export interface CapitalizedKeywordRow {
  graine: string;
  requete: string;
  angle: number;
  classeVolume: string;
  difficulte: number;
  resistanceAio: string;
  potentiel: string;
  verdict: string;
  source: string;
}

export function useKeywords(angle?: number) {
  return useQuery({
    queryKey: ["keywords", angle ?? 0],
    queryFn: () =>
      j<{ rows: CapitalizedKeywordRow[] }>(
        `/api/keywords${angle && angle > 0 ? "?angle=" + angle : ""}`
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
