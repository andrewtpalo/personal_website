<script setup lang="ts">
import { computed, ref } from 'vue'
import { KIND_LABEL, band, remediateTop, riskIndex, score, syntheticEntities, type EntityKind, type RiskEntity } from '../lib/risk'

const TOP_N = 5
const base = syntheticEntities()
const view = ref<EntityKind | 'all'>('all')
const remediated = ref<Map<string, RiskEntity>>(new Map())
const hovered = ref<string | null>(null)

const current = computed(() => base.map((e) => remediated.value.get(e.id) ?? e))
const visible = computed(() => current.value.filter((e) => view.value === 'all' || e.kind === view.value))
const scoped = (list: RiskEntity[]) => list.filter((e) => view.value === 'all' || e.kind === view.value)

const before = computed(() => riskIndex(scoped(base)))
const after = computed(() => riskIndex(scoped(current.value)))
const reduction = computed(() => (before.value ? Math.round(((before.value - after.value) / before.value) * 100) : 0))

const focus = computed(() => {
  const list = visible.value
  return list.find((e) => e.id === hovered.value) ?? [...list].sort((a, b) => score(b) - score(a))[0]
})

function remediate() {
  remediated.value = remediateTop(scoped(base), TOP_N)
}
function reset() {
  remediated.value = new Map()
}

// Geometry: 5×5 grid, impact on x, likelihood on y.
const PAD_L = 34
const PAD_B = 30
const SIZE = 300
const cell = SIZE / 5
const x = (impact: number) => PAD_L + ((impact - 0.5) / 5) * SIZE
const y = (likelihood: number) => SIZE - ((likelihood - 0.5) / 5) * SIZE
const cells = Array.from({ length: 25 }, (_, i) => {
  const col = i % 5
  const row = Math.floor(i / 5)
  return { col, row, band: band((col + 1) * (row + 1)) }
})

const tabs: { id: EntityKind | 'all'; label: string }[] = [
  { id: 'all', label: 'Overall' },
  ...(Object.keys(KIND_LABEL) as EntityKind[]).map((k) => ({ id: k, label: KIND_LABEL[k] })),
]
</script>

<template>
  <div class="panel risk">
    <div class="panel-head">
      <span class="mono">risk = likelihood × impact</span>
      <span class="chip">illustrative data</span>
    </div>

    <div class="tabs" role="tablist" aria-label="Entity type">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        role="tab"
        class="tab mono"
        :aria-selected="view === t.id"
        @click="view = t.id"
      >
        {{ t.label }}
      </button>
    </div>

    <div class="body">
      <svg :viewBox="`0 0 ${PAD_L + SIZE + 8} ${SIZE + PAD_B}`" class="matrix" role="img" :aria-label="`Risk matrix for ${view === 'all' ? 'all entities' : KIND_LABEL[view]}: overall risk index ${after}`">
        <rect
          v-for="c in cells"
          :key="`${c.col}-${c.row}`"
          :x="PAD_L + c.col * cell + 1"
          :y="SIZE - (c.row + 1) * cell + 1"
          :width="cell - 2"
          :height="cell - 2"
          rx="4"
          class="cell"
          :class="c.band"
        />
        <text v-for="n in 5" :key="`x${n}`" :x="PAD_L + (n - 0.5) * cell" :y="SIZE + 16" class="tick">{{ n }}</text>
        <text v-for="n in 5" :key="`y${n}`" :x="PAD_L - 12" :y="SIZE - (n - 0.5) * cell + 4" class="tick">{{ n }}</text>
        <text :x="PAD_L + SIZE / 2" :y="SIZE + 29" class="axis">impact →</text>
        <text :x="10" :y="SIZE / 2" class="axis" :transform="`rotate(-90 10 ${SIZE / 2})`">likelihood →</text>

        <g
          v-for="e in visible"
          :key="e.id"
          class="pt"
          :class="[e.kind, { fixed: remediated.has(e.id), on: focus?.id === e.id }]"
          :style="{ transform: `translate(${x(e.impact)}px, ${y(e.likelihood)}px)` }"
          @mouseenter="hovered = e.id"
          @mouseleave="hovered = null"
        >
          <circle r="11" class="halo" />
          <circle r="5" class="dot" />
        </g>
      </svg>

      <div class="side">
        <div class="index">
          <p class="k mono">risk index</p>
          <p class="v mono">
            <span :class="{ dim: remediated.size }">{{ before }}</span>
            <template v-if="remediated.size"> → <span class="after">{{ after }}</span></template>
          </p>
          <p v-if="remediated.size" class="delta mono">−{{ reduction }}% by fixing {{ TOP_N }} items</p>
          <p v-else class="delta mono muted">mean L × I, scaled 0 to 100</p>
        </div>

        <div v-if="focus" class="focus mono">
          <p class="fid">{{ focus.id }} <span class="kind">{{ KIND_LABEL[focus.kind].toLowerCase().slice(0, -1) }}</span></p>
          <p>L {{ focus.likelihood.toFixed(1) }} × I {{ focus.impact.toFixed(1) }} = <b :class="band(score(focus))">{{ score(focus).toFixed(1) }}</b></p>
          <p class="muted">{{ band(score(focus)) }}{{ remediated.has(focus.id) ? ', remediated' : '' }}</p>
        </div>

        <div class="actions">
          <button v-if="!remediated.size" type="button" class="btn btn--primary" @click="remediate">remediate top {{ TOP_N }} →</button>
          <button v-else type="button" class="btn" @click="reset">reset</button>
        </div>
        <p class="note">
          Every entity gets a score; scores roll up by type and to an overall posture. Fixing the few highest scores moves the
          index far more than fixing many low ones.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-head .chip {
  margin-left: auto;
}
.tabs {
  display: flex;
  gap: 4px;
  padding: 10px 12px 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.tab {
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: none;
  font-size: 12px;
  color: var(--text-3);
  cursor: pointer;
  white-space: nowrap;
}
.tab:hover {
  color: var(--text);
}
.tab[aria-selected='true'] {
  color: var(--accent);
  border-color: rgb(var(--accent-rgb) / 0.35);
  background: var(--accent-soft);
}
.body {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 12px 16px 18px;
}
.matrix {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}
.cell {
  stroke: none;
}
.cell.low {
  fill: rgb(130 168 255 / 0.07);
}
.cell.medium {
  fill: rgb(255 180 84 / 0.08);
}
.cell.high {
  fill: rgb(255 180 84 / 0.18);
}
.cell.critical {
  fill: rgb(255 92 122 / 0.2);
}
.tick,
.axis {
  fill: var(--text-3);
  font-family: var(--mono);
  font-size: 11px;
  text-anchor: middle;
}
.pt {
  cursor: pointer;
  transition: transform 0.9s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.halo {
  fill: transparent;
}
.dot {
  stroke: var(--bg);
  stroke-width: 1.5;
  transition: r 0.2s;
}
.pt.app .dot {
  fill: var(--accent);
}
.pt.endpoint .dot {
  fill: var(--info);
}
.pt.person .dot {
  fill: #c4a7ff;
}
.pt.account .dot {
  fill: var(--warn);
}
.pt.on .halo {
  fill: none;
  stroke: var(--text);
  stroke-width: 1.5;
}
.pt.fixed .dot {
  stroke: var(--accent);
  stroke-width: 2;
}

.side {
  display: grid;
  gap: 14px;
  min-width: 0;
}
.index .k {
  font-size: 11px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.index .v {
  font-size: 40px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--text);
}
.index .dim {
  color: var(--text-3);
  text-decoration: line-through;
  text-decoration-thickness: 2px;
}
.index .after {
  color: var(--accent);
}
.delta {
  font-size: 12px;
  color: var(--accent);
}
.muted {
  color: var(--text-3);
}
.focus {
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--bg);
  font-size: 12.5px;
  display: grid;
  gap: 2px;
}
.fid {
  color: var(--text);
  font-weight: 700;
}
.kind {
  font-weight: 400;
  color: var(--text-3);
}
b.low {
  color: var(--info);
}
b.medium,
b.high {
  color: var(--warn);
}
b.critical {
  color: var(--crit);
}
.actions .btn {
  width: 100%;
  justify-content: center;
}
.note {
  font-size: 13px;
  color: var(--text-3);
  line-height: 1.5;
}
@media (max-width: 640px) {
  .body {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
