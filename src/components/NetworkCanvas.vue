<script setup lang="ts">
/**
 * Hero background: a drifting network of hosts. Packets hop between nearby
 * nodes; a small share are flagged malicious and get caught (red pulse) when
 * they reach a sensor node. Purely decorative and aria-hidden.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cssVar, useCanvasSize, useReducedMotion, useVisibleAnimation } from '../composables/motion'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  sensor: boolean
}
interface Packet {
  from: number
  to: number
  t: number
  speed: number
  bad: boolean
  hops: number
}
interface Pulse {
  x: number
  y: number
  age: number
  bad: boolean
}

const canvas = ref<HTMLCanvasElement | null>(null)
const reduced = useReducedMotion()
const LINK = 150
const nodes: Node[] = []
const packets: Packet[] = []
const pulses: Pulse[] = []
const pointer = { x: -1e4, y: -1e4 }
let colors = { accent: '#7cf7c5', info: '#82a8ff', crit: '#ff5c7a', line: '#263242' }
let spawnTimer = 0

const size = useCanvasSize(canvas, (w, h) => {
  seed(w, h)
  draw(0)
})

function seed(w: number, h: number) {
  const count = Math.max(24, Math.min(90, Math.round((w * h) / 15000)))
  nodes.length = 0
  packets.length = 0
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 9,
      vy: (Math.random() - 0.5) * 9,
      sensor: Math.random() < 0.14,
    })
  }
}

function neighbors(i: number): number[] {
  const a = nodes[i]!
  const result: number[] = []
  nodes.forEach((b, j) => {
    if (j !== i && Math.hypot(a.x - b.x, a.y - b.y) < LINK) result.push(j)
  })
  return result
}

function spawn() {
  const from = Math.floor(Math.random() * nodes.length)
  const options = neighbors(from)
  if (!options.length) return
  packets.push({
    from,
    to: options[Math.floor(Math.random() * options.length)]!,
    t: 0,
    speed: 0.7 + Math.random() * 0.6,
    bad: Math.random() < 0.12,
    hops: 0,
  })
}

function step(dt: number) {
  const { w, h } = size
  for (const n of nodes) {
    n.x += n.vx * dt
    n.y += n.vy * dt
    if (n.x < -20 || n.x > w + 20) n.vx *= -1
    if (n.y < -20 || n.y > h + 20) n.vy *= -1
  }

  spawnTimer -= dt
  if (spawnTimer <= 0 && packets.length < 40) {
    spawn()
    spawnTimer = 0.12
  }

  for (let i = packets.length - 1; i >= 0; i--) {
    const p = packets[i]!
    p.t += p.speed * dt
    if (p.t < 1) continue
    const at = nodes[p.to]!
    if (p.bad && at.sensor) {
      pulses.push({ x: at.x, y: at.y, age: 0, bad: true })
      packets.splice(i, 1)
      continue
    }
    const next = neighbors(p.to).filter((j) => j !== p.from)
    if (p.hops > 5 || !next.length) {
      if (!p.bad && Math.random() < 0.3) pulses.push({ x: at.x, y: at.y, age: 0, bad: false })
      packets.splice(i, 1)
      continue
    }
    p.from = p.to
    p.to = next[Math.floor(Math.random() * next.length)]!
    p.t = 0
    p.hops++
  }

  for (let i = pulses.length - 1; i >= 0; i--) {
    pulses[i]!.age += dt
    if (pulses[i]!.age > 1.2) pulses.splice(i, 1)
  }
}

function draw(dt: number) {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return
  if (dt > 0) step(dt)

  const { w, h, dpr } = size
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  // Edges, fading with distance; brighter near the pointer.
  ctx.lineWidth = 1
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i]!
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j]!
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (d > LINK) continue
      const near = Math.hypot((a.x + b.x) / 2 - pointer.x, (a.y + b.y) / 2 - pointer.y) < 140
      ctx.globalAlpha = (1 - d / LINK) * (near ? 0.55 : 0.22)
      ctx.strokeStyle = near ? colors.accent : colors.line
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
  }

  // Pointer acts as a probe: connects to nodes in range.
  ctx.strokeStyle = colors.accent
  for (const n of nodes) {
    const d = Math.hypot(n.x - pointer.x, n.y - pointer.y)
    if (d > 160) continue
    ctx.globalAlpha = (1 - d / 160) * 0.5
    ctx.setLineDash([3, 4])
    ctx.beginPath()
    ctx.moveTo(pointer.x, pointer.y)
    ctx.lineTo(n.x, n.y)
    ctx.stroke()
  }
  ctx.setLineDash([])

  for (const n of nodes) {
    ctx.globalAlpha = n.sensor ? 0.95 : 0.6
    ctx.fillStyle = n.sensor ? colors.info : colors.line
    if (n.sensor) {
      ctx.strokeStyle = colors.info
      ctx.globalAlpha = 0.35
      ctx.strokeRect(n.x - 5, n.y - 5, 10, 10)
      ctx.globalAlpha = 0.95
    }
    ctx.beginPath()
    ctx.arc(n.x, n.y, n.sensor ? 2.4 : 1.8, 0, Math.PI * 2)
    ctx.fill()
  }

  for (const p of packets) {
    const a = nodes[p.from]!
    const b = nodes[p.to]!
    const x = a.x + (b.x - a.x) * p.t
    const y = a.y + (b.y - a.y) * p.t
    ctx.globalAlpha = 0.95
    ctx.fillStyle = p.bad ? colors.crit : colors.accent
    ctx.shadowColor = ctx.fillStyle
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(x, y, p.bad ? 2.2 : 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  for (const p of pulses) {
    const k = p.age / 1.2
    ctx.globalAlpha = (1 - k) * (p.bad ? 0.9 : 0.4)
    ctx.strokeStyle = p.bad ? colors.crit : colors.accent
    ctx.lineWidth = p.bad ? 1.5 : 1
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4 + k * (p.bad ? 26 : 14), 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

const motion = ref(true)
watch(reduced, (r) => {
  motion.value = !r
  if (r) {
    packets.length = 0
    draw(0)
  }
}, { immediate: true })
const anim = useVisibleAnimation(canvas, (dt) => draw(dt), motion)
watch(motion, () => anim.restart())

function onPointer(e: PointerEvent) {
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return
  pointer.x = e.clientX - rect.left
  pointer.y = e.clientY - rect.top
}

function readColors() {
  colors = {
    accent: cssVar('--accent'),
    info: cssVar('--info'),
    crit: cssVar('--crit'),
    line: cssVar('--line-2'),
  }
  if (reduced.value) draw(0)
}

onMounted(() => {
  readColors()
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('accentchange', readColors)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointer)
  window.removeEventListener('accentchange', readColors)
})
</script>

<template>
  <canvas ref="canvas" class="network" aria-hidden="true"></canvas>
</template>

<style scoped>
.network {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  mask-image: linear-gradient(180deg, #000 55%, transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, #000 55%, transparent 100%);
}
</style>
