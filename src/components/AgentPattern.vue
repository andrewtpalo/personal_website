<script setup lang="ts">
/**
 * Illustrative human-in-the-loop multi-agent pattern (not a product diagram).
 * A simulated run: a leader dispatches work to a specialist, the specialist
 * proposes an action, a human approves it at the gate, and the action is
 * committed to an append-only audit log.
 */
import { computed, ref } from 'vue'
import { useReducedMotion, useVisibleAnimation } from '../composables/motion'
import { mulberry32 } from '../lib/rng'

const W = 420
const H = 360
const CX = W / 2
const CY = H / 2 + 6
const LEADERS = 3
const SPECIALISTS = 4

interface Pt {
  x: number
  y: number
}
const leaders: (Pt & { name: string; specialists: Pt[] })[] = Array.from({ length: LEADERS }, (_, i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / LEADERS
  const lx = CX + Math.cos(a) * 112
  const ly = CY + Math.sin(a) * 112
  return {
    name: `lead-${String.fromCharCode(97 + i)}`,
    x: lx,
    y: ly,
    specialists: Array.from({ length: SPECIALISTS }, (_, j) => {
      const b = a + ((j - (SPECIALISTS - 1) / 2) * 0.5)
      return { x: lx + Math.cos(b) * 56, y: ly + Math.sin(b) * 56 }
    }),
  }
})

type Phase = 'dispatch' | 'work' | 'propose' | 'approve' | 'commit'
const PHASES: Phase[] = ['dispatch', 'work', 'propose', 'approve', 'commit']
const PHASE_S = 0.75

interface LogRow {
  id: number
  time: string
  text: string
  tone: 'dim' | 'info' | 'warn' | 'accent'
}

const rand = mulberry32(7)
const leader = ref(0)
const specialist = ref(0)
const phase = ref<Phase>('dispatch')
const progress = ref(0)
const log = ref<LogRow[]>([])
let auditSeq = 4100
let rowId = 0
let simTime = 0

const reduced = useReducedMotion()
const root = ref<HTMLElement | null>(null)
const motion = computed(() => !reduced.value)

function stamp() {
  const s = Math.floor(simTime)
  return `t+${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function push(text: string, tone: LogRow['tone']) {
  log.value.unshift({ id: rowId++, time: stamp(), text, tone })
  if (log.value.length > 6) log.value.pop()
}

function enter(p: Phase) {
  const L = leaders[leader.value]!.name
  const S = `spec-${specialist.value + 1}`
  phase.value = p
  if (p === 'dispatch') push(`${L} → ${S} · dispatch`, 'dim')
  if (p === 'propose') push(`${S} · approval requested`, 'warn')
  if (p === 'approve') push('human · approved', 'info')
  if (p === 'commit') push(`audit #${auditSeq++} · committed`, 'accent')
}

function nextRun() {
  leader.value = Math.floor(rand() * LEADERS)
  specialist.value = Math.floor(rand() * SPECIALISTS)
  enter('dispatch')
}

nextRun()

useVisibleAnimation(root, (dt) => {
  simTime += dt
  progress.value += dt / PHASE_S
  if (progress.value < 1) return
  progress.value = 0
  const i = PHASES.indexOf(phase.value)
  if (i === PHASES.length - 1) nextRun()
  else enter(PHASES[i + 1]!)
}, motion)

const L = computed(() => leaders[leader.value]!)
const S = computed(() => L.value.specialists[specialist.value]!)

/** Position of the travelling token for the current phase. */
const token = computed<Pt | null>(() => {
  const k = progress.value
  const lerp = (a: Pt, b: Pt): Pt => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k })
  const gate = { x: CX, y: CY }
  switch (phase.value) {
    case 'dispatch':
      return lerp(L.value, S.value)
    case 'work':
      return null
    case 'propose':
      return lerp(S.value, gate)
    case 'approve':
      return null
    case 'commit':
      return lerp(gate, { x: CX, y: H - 26 })
  }
})
</script>

<template>
  <div ref="root" class="panel agents">
    <div class="panel-head">
      <span class="mono">hitl-orchestration</span>
      <span class="chip">illustrative · simulated</span>
    </div>
    <div class="body">
      <svg :viewBox="`0 0 ${W} ${H}`" class="graph" role="img" aria-label="Diagram: leader agents dispatch tasks to specialist agents; every proposed action passes a human approval gate and is written to an audit log.">
        <g v-for="(l, i) in leaders" :key="l.name">
          <line :x1="CX" :y1="CY" :x2="l.x" :y2="l.y" class="edge" :class="{ hot: i === leader && phase === 'propose' }" />
          <g v-for="(s, j) in l.specialists" :key="j">
            <line :x1="l.x" :y1="l.y" :x2="s.x" :y2="s.y" class="edge" :class="{ hot: i === leader && j === specialist && phase !== 'commit' }" />
            <circle :cx="s.x" :cy="s.y" r="7" class="spec" :class="{ busy: i === leader && j === specialist && (phase === 'work' || phase === 'propose') }" />
          </g>
          <circle :cx="l.x" :cy="l.y" r="13" class="lead" :class="{ on: i === leader }" />
          <text :x="l.x" :y="l.y + 4" class="label">{{ l.name.slice(-1).toUpperCase() }}</text>
        </g>
        <line :x1="CX" :y1="CY" :x2="CX" :y2="H - 26" class="edge" :class="{ hot: phase === 'commit' }" />
        <rect :x="CX - 38" :y="H - 26" width="76" height="22" rx="5" class="audit" :class="{ on: phase === 'commit' }" />
        <text :x="CX" :y="H - 11" class="label">audit.log</text>
        <rect :x="CX - 26" :y="CY - 18" width="52" height="36" rx="8" class="gate" :class="{ waiting: phase === 'propose', approved: phase === 'approve' || phase === 'commit' }" />
        <text :x="CX" :y="CY + 4" class="gate-label">HITL</text>
        <circle v-if="token" :cx="token.x" :cy="token.y" r="4" class="token" />
      </svg>

      <div class="log mono" aria-live="off">
        <p class="log-head">audit.log <span>append-only</span></p>
        <TransitionGroup name="row" tag="ol">
          <li v-for="row in log" :key="row.id" :class="row.tone">
            <span class="time">{{ row.time }}</span> {{ row.text }}
          </li>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agents {
  overflow: hidden;
}
.panel-head .chip {
  margin-left: auto;
}
.body {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  align-items: center;
}
.graph {
  width: 100%;
  height: auto;
  display: block;
  padding: 8px;
}
.edge {
  stroke: var(--line-2);
  stroke-width: 1;
  transition: stroke 0.25s;
}
.edge.hot {
  stroke: var(--accent);
  stroke-width: 1.5;
}
.spec {
  fill: var(--panel);
  stroke: var(--line-2);
  stroke-width: 1.5;
  transition:
    fill 0.25s,
    stroke 0.25s;
}
.spec.busy {
  fill: var(--accent-soft);
  stroke: var(--accent);
}
.lead {
  fill: var(--panel-2);
  stroke: var(--info);
  stroke-width: 1.5;
}
.lead.on {
  fill: var(--info-soft);
  stroke-width: 2.5;
}
.label,
.gate-label {
  pointer-events: none;
  fill: var(--text-2);
  font-family: var(--mono);
  font-size: 11px;
  text-anchor: middle;
}
.gate-label {
  fill: var(--text);
  font-weight: 700;
}
.gate {
  fill: var(--panel-2);
  stroke: var(--line-2);
  stroke-width: 1.5;
  transition:
    fill 0.25s,
    stroke 0.25s;
}
.gate.waiting {
  fill: var(--warn-soft);
  stroke: var(--warn);
}
.gate.approved {
  fill: var(--accent-soft);
  stroke: var(--accent);
}
.audit {
  fill: var(--panel);
  stroke: var(--line-2);
  transition: stroke 0.25s;
}
.audit.on {
  stroke: var(--accent);
}
.token {
  fill: var(--accent);
  filter: drop-shadow(0 0 4px var(--accent));
}

.log {
  align-self: stretch;
  padding: 16px;
  border-left: 1px solid var(--line);
  font-size: 12px;
  min-width: 0;
}
.log-head {
  display: flex;
  justify-content: space-between;
  color: var(--text-2);
  margin-bottom: 10px;
}
.log-head span {
  color: var(--text-3);
}
.log ol {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 6px;
}
.log li {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.time {
  color: var(--text-3);
}
.dim {
  color: var(--text-2);
}
.info {
  color: var(--info);
}
.warn {
  color: var(--warn);
}
.accent {
  color: var(--accent);
}
.row-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.row-enter-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}
.row-leave-active {
  display: none;
}

@media (max-width: 760px) {
  .body {
    grid-template-columns: minmax(0, 1fr);
  }
  .log {
    border-left: 0;
    border-top: 1px solid var(--line);
  }
}
</style>
