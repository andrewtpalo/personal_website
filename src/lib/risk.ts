/**
 * Likelihood × impact risk model used by the interactive matrix.
 * The entities are synthetic: generated from a fixed seed, they illustrate
 * the method and contain no real data.
 */
import { mulberry32 } from './rng'

export type EntityKind = 'app' | 'endpoint' | 'person' | 'account'

export interface RiskEntity {
  id: string
  kind: EntityKind
  /** 1 (rare) … 5 (almost certain). */
  likelihood: number
  /** 1 (negligible) … 5 (severe). */
  impact: number
}

export const KIND_LABEL: Record<EntityKind, string> = {
  app: 'Applications',
  endpoint: 'Endpoints',
  person: 'People',
  account: 'Accounts',
}

const PREFIX: Record<EntityKind, string> = { app: 'APP', endpoint: 'EP', person: 'USR', account: 'ACCT' }

export const score = (e: Pick<RiskEntity, 'likelihood' | 'impact'>) => e.likelihood * e.impact

export type Band = 'low' | 'medium' | 'high' | 'critical'
export function band(s: number): Band {
  if (s >= 16) return 'critical'
  if (s >= 10) return 'high'
  if (s >= 5) return 'medium'
  return 'low'
}

/** Overall posture: mean entity score as a 0–100 index (25 = max L × I). */
export function riskIndex(entities: RiskEntity[]): number {
  if (!entities.length) return 0
  const mean = entities.reduce((sum, e) => sum + score(e), 0) / entities.length
  return Math.round((mean / 25) * 100)
}

/** Deterministic synthetic population, skewed so a handful of entities dominate the risk. */
export function syntheticEntities(seed = 2026, perKind = 7): RiskEntity[] {
  const rand = mulberry32(seed)
  const clamp = (v: number) => Math.min(4.85, Math.max(1.15, v))
  const out: RiskEntity[] = []
  for (const kind of Object.keys(PREFIX) as EntityKind[]) {
    for (let i = 0; i < perKind; i++) {
      const hot = i < 2 // a couple of hot spots per kind
      out.push({
        id: `${PREFIX[kind]}-${String(100 + Math.floor(rand() * 900))}`,
        kind,
        likelihood: clamp(hot ? 3.6 + rand() * 1.3 : 1.2 + rand() * 2.8),
        impact: clamp(hot ? 3.4 + rand() * 1.5 : 1.2 + rand() * 3.2),
      })
    }
  }
  return out
}

/**
 * Remediate the top-n entities by score. Fixes (patching, MFA, least
 * privilege, hardening) mostly cut likelihood; impact is a property of the
 * asset and stays put.
 */
export function remediateTop(entities: RiskEntity[], n: number): Map<string, RiskEntity> {
  const top = [...entities].sort((a, b) => score(b) - score(a)).slice(0, n)
  return new Map(top.map((e) => [e.id, { ...e, likelihood: Math.max(1.15, e.likelihood - 2.6) }]))
}
