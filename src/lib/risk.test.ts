import { describe, expect, it } from 'vitest'
import { band, remediateTop, riskIndex, score, syntheticEntities } from './risk'

describe('risk model', () => {
  it('scores likelihood × impact into bands', () => {
    expect(score({ likelihood: 5, impact: 5 })).toBe(25)
    expect(band(25)).toBe('critical')
    expect(band(12)).toBe('high')
    expect(band(6)).toBe('medium')
    expect(band(2)).toBe('low')
  })

  it('generates a deterministic population across all entity kinds', () => {
    const a = syntheticEntities(7)
    expect(a).toEqual(syntheticEntities(7))
    expect(new Set(a.map((e) => e.kind))).toEqual(new Set(['app', 'endpoint', 'person', 'account']))
    for (const e of a) {
      expect(e.likelihood).toBeGreaterThanOrEqual(1)
      expect(e.impact).toBeLessThanOrEqual(5)
    }
  })

  it('remediating the top scores cuts likelihood, keeps impact, and lowers the index', () => {
    const all = syntheticEntities()
    const fixed = remediateTop(all, 5)
    expect(fixed.size).toBe(5)
    const top = [...all].sort((x, y) => score(y) - score(x)).slice(0, 5)
    for (const e of top) {
      const after = fixed.get(e.id)!
      expect(after.impact).toBe(e.impact)
      expect(after.likelihood).toBeLessThan(e.likelihood)
    }
    const afterAll = all.map((e) => fixed.get(e.id) ?? e)
    expect(riskIndex(afterAll)).toBeLessThan(riskIndex(all))
  })
})
