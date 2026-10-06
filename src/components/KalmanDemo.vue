<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RangeSimulation, rmse, type Sample } from '../lib/kalman'
import { cssVar, useCanvasSize, useReducedMotion, useVisibleAnimation } from '../composables/motion'

const WINDOW_S = 8
const canvas = ref<HTMLCanvasElement | null>(null)
const reduced = useReducedMotion()

// Sliders: sensor noise σ in metres, process noise on a log scale.
// 5 cm matches the thesis's baseline simulation.
const sigmaCm = ref(5)
const qExp = ref(0.5) // q = 10^qExp
const playing = ref(true)
const sigma = computed(() => sigmaCm.value / 100)
const q = computed(() => 10 ** qExp.value)

let sim = new RangeSimulation(sigma.value, q.value)
const samples: Sample[] = []
const capacity = Math.round(WINDOW_S / sim.dt)
let carry = 0

const stats = ref({ rRaw: 0, rKf: 0, vRaw: 0, vKf: 0 })

let mono = 'monospace'
let colors = { bg: '#0c1117', text: '#a1adbb', faint: '#74818f', line: '#19222d', accent: '#7cf7c5', soft: 'rgba(124,247,197,.12)', info: '#82a8ff', crit: '#ff5c7a' }

function prime() {
  sim = new RangeSimulation(sigma.value, q.value, 1 / 15, Math.floor(Math.random() * 1e9))
  samples.length = 0
  for (let i = 0; i < capacity; i++) samples.push(sim.step())
  updateStats()
}

function updateStats() {
  stats.value = {
    rRaw: rmse(samples, (s) => s.z, (s) => s.r),
    rKf: rmse(samples, (s) => s.rHat, (s) => s.r),
    vRaw: rmse(samples, (s) => s.vDiff, (s) => s.v),
    vKf: rmse(samples, (s) => s.vHat, (s) => s.v),
  }
}

watch([sigma, q], () => {
  sim.tune(sigma.value, q.value)
  if (reduced.value || !playing.value) {
    prime()
    draw()
  }
})

const size = useCanvasSize(canvas, () => draw())

function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx || !samples.length) return
  const { w, h, dpr } = size
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const padL = 40
  const padR = 10
  const gap = 26
  const paneH = (h - gap - 24) / 2
  const t0 = samples[0]!.t
  const xOf = (t: number) => padL + ((t - t0) / WINDOW_S) * (w - padL - padR)

  const pane = (
    top: number,
    min: number,
    max: number,
    label: string,
    ticks: number[],
    series: { pick: (s: Sample) => number; color: string; width?: number; dots?: boolean; dash?: number[]; alpha?: number }[],
    band?: { lo: (s: Sample) => number; hi: (s: Sample) => number },
  ) => {
    const yOf = (v: number) => top + paneH - ((v - min) / (max - min)) * paneH
    ctx.save()
    ctx.font = `11px ${mono}`
    ctx.fillStyle = colors.faint
    ctx.strokeStyle = colors.line
    ctx.lineWidth = 1
    for (const tick of ticks) {
      const y = Math.round(yOf(tick)) + 0.5
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(w - padR, y)
      ctx.stroke()
      ctx.textAlign = 'right'
      ctx.fillText(String(tick), padL - 8, y + 4)
    }
    ctx.textAlign = 'left'

    ctx.beginPath()
    ctx.rect(padL, top, w - padL - padR, paneH)
    ctx.clip()

    if (band) {
      ctx.beginPath()
      samples.forEach((s, i) => (i ? ctx.lineTo(xOf(s.t), yOf(band.hi(s))) : ctx.moveTo(xOf(s.t), yOf(band.hi(s)))))
      for (let i = samples.length - 1; i >= 0; i--) ctx.lineTo(xOf(samples[i]!.t), yOf(band.lo(samples[i]!)))
      ctx.closePath()
      ctx.fillStyle = colors.soft
      ctx.fill()
    }

    for (const sr of series) {
      ctx.strokeStyle = ctx.fillStyle = sr.color
      ctx.lineWidth = sr.width ?? 1.5
      ctx.setLineDash(sr.dash ?? [])
      if (sr.dots) {
        ctx.globalAlpha = 0.75
        for (const s of samples) {
          ctx.beginPath()
          ctx.arc(xOf(s.t), yOf(sr.pick(s)), 1.6, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      } else {
        ctx.globalAlpha = sr.alpha ?? 1
        ctx.beginPath()
        samples.forEach((s, i) => (i ? ctx.lineTo(xOf(s.t), yOf(sr.pick(s))) : ctx.moveTo(xOf(s.t), yOf(sr.pick(s)))))
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }
    // Pane label on a backing plate so traces never obscure it.
    ctx.setLineDash([])
    ctx.fillStyle = colors.bg
    ctx.globalAlpha = 0.85
    ctx.fillRect(padL + 2, top + 1, ctx.measureText(label).width + 12, 16)
    ctx.globalAlpha = 1
    ctx.fillStyle = colors.text
    ctx.fillText(label, padL + 8, top + 13)
    ctx.restore()
  }

  pane(4, 0, 2.4, 'range r (m)', [0, 1, 2], [
    { pick: (s) => s.z, color: colors.info, dots: true },
    { pick: (s) => s.r, color: colors.faint, width: 1, dash: [4, 4] },
    { pick: (s) => s.rHat, color: colors.accent, width: 2 },
  ], { lo: (s) => s.rHat - 2 * s.sigma, hi: (s) => s.rHat + 2 * s.sigma })

  pane(4 + paneH + gap, -2.5, 2.5, 'range-rate ṙ (m/s)', [-2, 0, 2], [
    { pick: (s) => s.vDiff, color: colors.crit, width: 1, alpha: 0.55 },
    { pick: (s) => s.v, color: colors.faint, width: 1, dash: [4, 4] },
    { pick: (s) => s.vHat, color: colors.accent, width: 2 },
  ])
}

const motion = computed(() => playing.value && !reduced.value)
useVisibleAnimation(canvas, (dt) => {
  carry += dt
  let stepped = false
  while (carry >= sim.dt) {
    carry -= sim.dt
    samples.push(sim.step())
    if (samples.length > capacity) samples.shift()
    stepped = true
  }
  if (stepped) {
    updateStats()
    draw()
  }
}, motion)

function readColors() {
  colors = {
    bg: cssVar('--panel'),
    text: cssVar('--text-2'),
    faint: cssVar('--text-3'),
    line: cssVar('--line'),
    accent: cssVar('--accent'),
    soft: cssVar('--accent-soft'),
    info: cssVar('--info'),
    crit: cssVar('--crit'),
  }
  draw()
}

onMounted(() => {
  mono = cssVar('--mono')
  prime()
  readColors()
  window.addEventListener('accentchange', readColors)
})
onBeforeUnmount(() => window.removeEventListener('accentchange', readColors))

const fmt = (n: number) => n.toFixed(n < 1 ? 3 : 2)
const gain = computed(() => (stats.value.vKf > 0 ? stats.value.vRaw / stats.value.vKf : 0))
</script>

<template>
  <div class="panel kalman">
    <div class="panel-head">
      <span class="mono">kalman.ts: constant-velocity filter @ 15 Hz</span>
      <button v-if="!reduced" type="button" class="ctl" :aria-pressed="!playing" @click="playing = !playing">
        {{ playing ? '❚❚ pause' : '▶ play' }}
      </button>
      <button type="button" class="ctl" @click="prime(); draw()">↺ reseed</button>
    </div>

    <canvas ref="canvas" class="plot" role="img" aria-label="Live plot: noisy sonar range readings, the true range, and the Kalman-filtered estimate; below, range-rate from naive differencing versus the filter's estimate."></canvas>

    <ul class="legend mono" aria-hidden="true">
      <li><i class="sw dots"></i>sensor readings</li>
      <li><i class="sw truth"></i>ground truth</li>
      <li><i class="sw kf"></i>Kalman estimate ±2σ</li>
      <li><i class="sw diff"></i>naive Δz/Δt</li>
    </ul>

    <div class="controls">
      <label>
        <span class="mono">sensor noise σ <b>{{ sigmaCm }} cm</b></span>
        <input v-model.number="sigmaCm" type="range" min="1" max="30" step="1" />
      </label>
      <label>
        <span class="mono">process noise q <b>{{ q.toFixed(q < 10 ? 2 : 0) }}</b></span>
        <input v-model.number="qExp" type="range" min="-1.5" max="2.5" step="0.05" />
      </label>
    </div>

    <dl class="readout mono">
      <div>
        <dt>range RMSE</dt>
        <dd><span class="raw">{{ fmt(stats.rRaw) }}</span> → <span class="kf">{{ fmt(stats.rKf) }}</span> m</dd>
      </div>
      <div>
        <dt>range-rate RMSE</dt>
        <dd><span class="raw">{{ fmt(stats.vRaw) }}</span> → <span class="kf">{{ fmt(stats.vKf) }}</span> m/s</dd>
      </div>
      <div>
        <dt>ṙ error reduction</dt>
        <dd><span class="kf">{{ gain.toFixed(1) }}×</span></dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.panel-head {
  flex-wrap: wrap;
}
.panel-head .mono {
  margin-right: auto;
}
.ctl {
  padding: 3px 10px;
  border: 1px solid var(--line-2);
  border-radius: 6px;
  background: var(--panel);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-2);
  cursor: pointer;
}
.ctl:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.plot {
  display: block;
  width: 100%;
  height: clamp(280px, 38vw, 360px);
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin: 0;
  padding: 4px 16px 0;
  list-style: none;
  font-size: 11px;
  color: var(--text-2);
}
.sw {
  display: inline-block;
  width: 14px;
  height: 2px;
  margin-right: 6px;
  vertical-align: middle;
}
.sw.dots {
  height: 4px;
  background: radial-gradient(circle, var(--info) 1.5px, transparent 2px) 0 0 / 5px 4px;
}
.sw.truth {
  background: repeating-linear-gradient(90deg, var(--text-3) 0 3px, transparent 3px 6px);
}
.sw.kf {
  height: 3px;
  background: var(--accent);
}
.sw.diff {
  background: var(--crit);
}
.controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
  padding: 16px;
}
.controls label {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: var(--text-2);
}
.controls b {
  color: var(--accent);
  font-weight: 500;
}
input[type='range'] {
  width: 100%;
  accent-color: var(--accent);
}
.readout {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  border-top: 1px solid var(--line);
}
.readout div {
  padding: 12px 16px;
  border-left: 1px solid var(--line);
}
.readout div:first-child {
  border-left: 0;
}
.readout dt {
  font-size: 11px;
  color: var(--text-3);
}
.readout dd {
  margin: 2px 0 0;
  font-size: 14px;
}
.raw {
  color: var(--crit);
}
.kf {
  color: var(--accent);
}
@media (max-width: 640px) {
  .controls,
  .readout {
    grid-template-columns: minmax(0, 1fr);
  }
  .readout div {
    border-left: 0;
    border-top: 1px solid var(--line);
  }
  .readout div:first-child {
    border-top: 0;
  }
}
</style>
