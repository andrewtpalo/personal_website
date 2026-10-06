/**
 * Constant-velocity Kalman filter for a 1-D range sensor.
 *
 *   state  x = [r, ṙ]ᵀ          (range, range-rate)
 *   model  x' = F x + w,  F = [[1, dt], [0, 1]],  w ~ N(0, Q)
 *   meas.  z  = H x + v,  H = [1, 0],             v ~ N(0, R)
 *
 * Q uses the discrete white-noise-acceleration model, scaled by q.
 * The 2×2 algebra is written out by hand: no matrix library, no allocations
 * per step, and every term maps directly onto the textbook equations.
 */

import { gaussian, mulberry32 } from './rng'

export interface KalmanOptions {
  /** Timestep in seconds. */
  dt: number
  /** Process (acceleration) noise spectral density. */
  q: number
  /** Measurement noise variance (σ² of the range sensor). */
  r: number
}

export class RangeKalman {
  /** Range estimate. */
  x0 = 0
  /** Range-rate estimate. */
  x1 = 0
  // Covariance P, row-major.
  p00 = 1
  p01 = 0
  p10 = 0
  p11 = 1

  constructor(
    public opts: KalmanOptions,
    initialRange = 0,
  ) {
    this.reset(initialRange)
  }

  reset(initialRange: number) {
    this.x0 = initialRange
    this.x1 = 0
    this.p00 = this.opts.r
    this.p01 = this.p10 = 0
    this.p11 = 4
  }

  predict() {
    const { dt, q } = this.opts
    this.x0 += dt * this.x1

    // P = F P Fᵀ + Q
    const p00 = this.p00 + dt * (this.p01 + this.p10) + dt * dt * this.p11
    const p01 = this.p01 + dt * this.p11
    const p10 = this.p10 + dt * this.p11
    const dt2 = dt * dt
    this.p00 = p00 + q * (dt2 * dt2) / 4
    this.p01 = p01 + q * (dt2 * dt) / 2
    this.p10 = p10 + q * (dt2 * dt) / 2
    this.p11 = this.p11 + q * dt2
  }

  update(z: number) {
    const s = this.p00 + this.opts.r // innovation covariance
    const k0 = this.p00 / s // Kalman gain
    const k1 = this.p10 / s
    const y = z - this.x0 // innovation

    this.x0 += k0 * y
    this.x1 += k1 * y

    // P = (I − K H) P
    const p00 = (1 - k0) * this.p00
    const p01 = (1 - k0) * this.p01
    const p10 = this.p10 - k1 * this.p00
    const p11 = this.p11 - k1 * this.p01
    this.p00 = p00
    this.p01 = p01
    this.p10 = p10
    this.p11 = p11
  }

  step(z: number) {
    this.predict()
    this.update(z)
  }

  /** 1σ uncertainty on the range estimate. */
  get rangeSigma() {
    return Math.sqrt(Math.max(this.p00, 0))
  }
}

/**
 * Ground-truth trajectory for the demo: a UAV repeatedly approaching a
 * surface under a constant τ̇ = 0.5 echoic-flow strategy, holding, then
 * backing off.
 *
 * τ = gap / (d gap/dt) is the time-to-contact signal an echolocating animal
 * can read straight from its echoes. Holding τ̇ constant at 0.5 is the
 * constant-deceleration docking profile: speed reaches zero exactly at the
 * stand-off distance, which is why the approach is quadratic in time.
 */
export const APPROACH = { far: 2, near: 0.3, approach: 4, hold: 0.6, retreat: 2.4, rest: 0.5 }
const PERIOD = APPROACH.approach + APPROACH.hold + APPROACH.retreat + APPROACH.rest

export function trueTrajectory(t: number): { r: number; v: number } {
  const { far, near, approach, hold, retreat } = APPROACH
  const span = far - near
  let u = ((t % PERIOD) + PERIOD) % PERIOD

  if (u < approach) {
    const s = u / approach
    return { r: near + span * (1 - s) ** 2, v: (-2 * span * (1 - s)) / approach }
  }
  u -= approach
  if (u < hold) return { r: near, v: 0 }
  u -= hold
  if (u < retreat) {
    const s = u / retreat
    return { r: near + span * (3 * s * s - 2 * s * s * s), v: (span * 6 * s * (1 - s)) / retreat }
  }
  return { r: far, v: 0 }
}

export interface Sample {
  t: number
  /** Ground truth. */
  r: number
  v: number
  /** Raw sensor reading, and range-rate from naively differencing raw readings. */
  z: number
  vDiff: number
  /** Filter estimates. */
  rHat: number
  vHat: number
  sigma: number
}

/** Steps the echoic-flow trajectory, a noisy range sensor, and the filter together. */
export class RangeSimulation {
  t = 0
  private rand: () => number
  private kf: RangeKalman
  private lastZ: number | null = null

  constructor(
    private sensorSigma: number,
    q: number,
    /** 15 Hz: the AR.Drone 2.0 ultrasonic sensor rate used in the thesis. */
    public readonly dt = 1 / 15,
    seed = 42,
  ) {
    this.rand = mulberry32(seed)
    this.kf = new RangeKalman({ dt, q, r: sensorSigma ** 2 }, trueTrajectory(0).r)
  }

  tune(sensorSigma: number, q: number) {
    this.sensorSigma = sensorSigma
    this.kf.opts.r = sensorSigma ** 2
    this.kf.opts.q = q
  }

  step(): Sample {
    this.t += this.dt
    const truth = trueTrajectory(this.t)
    const z = truth.r + gaussian(this.rand) * this.sensorSigma
    const vDiff = this.lastZ === null ? 0 : (z - this.lastZ) / this.dt
    this.lastZ = z
    this.kf.step(z)
    return { t: this.t, ...truth, z, vDiff, rHat: this.kf.x0, vHat: this.kf.x1, sigma: this.kf.rangeSigma }
  }
}

export function rmse(samples: Sample[], estimate: (s: Sample) => number, truth: (s: Sample) => number): number {
  if (!samples.length) return 0
  const sum = samples.reduce((acc, s) => acc + (estimate(s) - truth(s)) ** 2, 0)
  return Math.sqrt(sum / samples.length)
}
