import { describe, expect, it } from 'vitest'
import { dateKey, timeline } from './profile'

describe('dateKey', () => {
  it('orders present > month-year > bare year', () => {
    expect(dateKey('Present')).toBe(Number.POSITIVE_INFINITY)
    expect(dateKey('Mar 2022')).toBeCloseTo(2022.03)
    expect(dateKey('May 2020')).toBeCloseTo(2020.05)
    expect(dateKey('2019')).toBe(2019)
  })
})

describe('timeline', () => {
  it('lists roles and the degree newest first', () => {
    const labels = timeline.map((e) => (e.kind === 'role' ? e.role.org : 'education'))
    expect(labels).toEqual(['Fiserv', 'Eschweiler & Potashnik, LLC', 'education', 'Liberty Mutual', 'L Brands'])
  })
})
