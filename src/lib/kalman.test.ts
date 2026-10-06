import { describe, expect, it } from 'vitest'
import { APPROACH, RangeKalman, RangeSimulation, rmse, trueTrajectory, type Sample } from './kalman'

function run(sigma: number, q: number, steps: number, seed = 1): Sample[] {
  const sim = new RangeSimulation(sigma, q, 0.05, seed)
  return Array.from({ length: steps }, () => sim.step())
}

describe('trueTrajectory', () => {
  it('starts far, decelerates to rest at the stand-off distance', () => {
    expect(trueTrajectory(0).r).toBeCloseTo(APPROACH.far)
    const arrival = trueTrajectory(APPROACH.approach - 1e-9)
    expect(arrival.r).toBeCloseTo(APPROACH.near, 6)
    expect(arrival.v).toBeCloseTo(0, 6)
  })

  it('holds τ̇ = 0.5 during the approach (constant-deceleration docking)', () => {
    const tau = (t: number) => {
      const { r, v } = trueTrajectory(t)
      return (r - APPROACH.near) / v
    }
    const h = 1e-4
    for (const t of [0.5, 1.5, 2.5, 3.5]) {
      expect((tau(t + h) - tau(t - h)) / (2 * h)).toBeCloseTo(0.5, 4)
    }
  })

  it('velocity is the derivative of range', () => {
    const h = 1e-5
    for (const t of [0.7, 2.2, 4.3, 5.5, 6.4]) {
      const numeric = (trueTrajectory(t + h).r - trueTrajectory(t - h).r) / (2 * h)
      expect(trueTrajectory(t).v).toBeCloseTo(numeric, 4)
    }
  })
})

describe('RangeKalman', () => {
  it('converges to a constant range with shrinking uncertainty', () => {
    const kf = new RangeKalman({ dt: 0.05, q: 0.01, r: 0.01 }, 0)
    const before = kf.rangeSigma
    for (let i = 0; i < 400; i++) kf.step(2)
    expect(kf.x0).toBeCloseTo(2, 3)
    expect(kf.x1).toBeCloseTo(0, 2)
    expect(kf.rangeSigma).toBeLessThan(before)
  })

  it('keeps the covariance symmetric', () => {
    const kf = new RangeKalman({ dt: 0.05, q: 3, r: 0.01 }, 1)
    for (let i = 0; i < 50; i++) kf.step(1 + i * 0.01)
    expect(kf.p01).toBeCloseTo(kf.p10, 12)
  })
})

describe('RangeSimulation', () => {
  it('beats raw readings on range and naive differencing on range-rate', () => {
    const samples = run(0.1, 3, 2000).slice(40) // drop warm-up
    const rRaw = rmse(samples, (s) => s.z, (s) => s.r)
    const rKf = rmse(samples, (s) => s.rHat, (s) => s.r)
    const vRaw = rmse(samples, (s) => s.vDiff, (s) => s.v)
    const vKf = rmse(samples, (s) => s.vHat, (s) => s.v)
    expect(rKf).toBeLessThan(rRaw)
    expect(vKf * 5).toBeLessThan(vRaw)
  })

  it('is deterministic for a given seed', () => {
    expect(run(0.1, 3, 50, 9)).toEqual(run(0.1, 3, 50, 9))
  })
})
