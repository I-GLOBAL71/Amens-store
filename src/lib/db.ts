import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export function normalizePgPoolUrl(url: string): string {
  if (!/^postgres(ql)?:\/\//i.test(url)) return url
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('-pooler.') && !parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true')
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '25')
    }
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', '25')
    }
    return parsed.toString()
  } catch {
    return url
  }
}

export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const raw = env.DATABASE_URL
  const pgFallback =
    env.POSTGRES_PRISMA_URL ||
    env.NEON_DATABASE_URL ||
    env.POSTGRES_URL ||
    env.DATABASE_URL_UNPOOLED

  const selected =
    env.VERCEL && (!raw || raw.startsWith('file:'))
      ? pgFallback || raw
      : raw || pgFallback

  return selected ? normalizePgPoolUrl(selected) : undefined
}

const datasourceUrl = resolveDatabaseUrl()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })

globalForPrisma.prisma = db