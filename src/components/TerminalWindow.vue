<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { complete, execute, type Effect, type Line, type ShellContext } from '../lib/shell'
import { browserProbes } from '../lib/probes'
import { accent, downloadResume, goTo, setAccent } from '../lib/ui'
import { profile } from '../data/profile'
import { sections } from '../data/sections'
import { useReducedMotion } from '../composables/motion'

interface Entry {
  id: number
  input?: string
  lines: Line[]
}

const PROMPT_USER = 'visitor'
const PROMPT_HOST = 'andrewtpalo'

const entries = ref<Entry[]>([])
const input = ref('')
const busy = ref(false)
const history: string[] = []
let historyIndex = 0
let nextId = 0
let bootAborted = false

const screen = ref<HTMLElement | null>(null)
const field = ref<HTMLInputElement | null>(null)
const reduced = useReducedMotion()

const ctx: ShellContext = {
  history,
  build: { commit: __BUILD_COMMIT__, time: __BUILD_TIME__.slice(0, 10) },
  probes: browserProbes,
  env: () => ({
    resolution: `${window.innerWidth}×${window.innerHeight} @${devicePixelRatio}x`,
    uptimeSeconds: performance.now() / 1000,
    accent: accent.value,
  }),
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function scrollToEnd() {
  await nextTick()
  if (screen.value) screen.value.scrollTop = screen.value.scrollHeight
}

function print(lines: Line[], inputEcho?: string) {
  entries.value.push({ id: nextId++, input: inputEcho, lines })
  void scrollToEnd()
}

function applyEffect(effect: Effect | undefined) {
  if (!effect) return
  switch (effect.type) {
    case 'clear':
      entries.value = []
      break
    case 'navigate':
      goTo(effect.section)
      break
    case 'download':
      downloadResume()
      break
    case 'theme':
      setAccent(effect.accent)
      break
  }
}

async function run(command: string, refocus = true) {
  const trimmed = command.trim()
  input.value = ''
  if (!trimmed) {
    print([], '')
    return
  }
  if (history[history.length - 1] !== trimmed) history.push(trimmed)
  historyIndex = history.length

  busy.value = true
  const echoId = nextId
  print([], trimmed)
  try {
    const result = await execute(trimmed, ctx)
    const echo = entries.value.find((e) => e.id === echoId)
    if (echo) echo.lines = result.lines
    applyEffect(result.effect)
  } finally {
    busy.value = false
    await scrollToEnd()
    if (refocus) field.value?.focus({ preventScroll: true })
  }
}

function runFromClick(command: string) {
  bootAborted = true
  void run(command)
}

function onKeydown(e: KeyboardEvent) {
  bootAborted = true
  if (e.key === 'ArrowUp') {
    if (!history.length) return
    e.preventDefault()
    historyIndex = Math.max(0, historyIndex - 1)
    input.value = history[historyIndex] ?? ''
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    historyIndex = Math.min(history.length, historyIndex + 1)
    input.value = history[historyIndex] ?? ''
  } else if (e.key === 'Tab') {
    e.preventDefault()
    const { value, options } = complete(input.value)
    if (options.length > 1) print([options.map((o) => ({ text: `${o}  `, tone: 'info' as const }))], input.value)
    input.value = value
  } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
    e.preventDefault()
    entries.value = []
  } else if (e.ctrlKey && e.key.toLowerCase() === 'c' && !window.getSelection()?.toString()) {
    e.preventDefault()
    print([], `${input.value}^C`)
    input.value = ''
  }
}

function focusField() {
  // Don't steal a text selection the visitor is making in the output.
  if (window.getSelection()?.toString()) return
  field.value?.focus({ preventScroll: true })
}

/** "/" from anywhere on the page focuses the terminal. */
function onGlobalKey(e: KeyboardEvent) {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return
  const target = e.target as HTMLElement | null
  if (target?.closest('input, textarea, [contenteditable="true"]')) return
  e.preventDefault()
  field.value?.scrollIntoView({ block: 'center', behavior: reduced.value ? 'auto' : 'smooth' })
  field.value?.focus({ preventScroll: true })
}

async function boot() {
  const ok = (text: string): Line => [{ text: '[  ok  ] ', tone: 'accent' }, { text }]
  const bootLines: Line[] = [
    [{ text: `PaloOS 2.0 · tty1 · build ${ctx.build.commit}`, tone: 'dim' }],
    ok(`mounted ${sections.map((s) => `~/${s.id}`).join(' ')}`),
    ok(`loaded profile: ${profile.title}`),
    ok('0 trackers · 0 cookies · 0 third-party requests'),
    [],
  ]
  const fast = reduced.value
  for (const l of bootLines) {
    if (bootAborted) break
    print([l])
    if (!fast) await sleep(140)
  }
  if (!bootAborted) {
    const auto = 'whoami'
    if (!fast) {
      for (const ch of auto) {
        if (bootAborted) break
        input.value += ch
        await sleep(70)
      }
      await sleep(180)
    }
    if (!bootAborted) await run(auto, false)
  }
  print([
    [],
    [
      { text: 'try ', tone: 'dim' },
      { text: 'help', tone: 'accent', cmd: 'help' },
      { text: ' · ', tone: 'dim' },
      { text: 'experience', tone: 'accent', cmd: 'experience' },
      { text: ' · ', tone: 'dim' },
      { text: 'platform', tone: 'accent', cmd: 'platform' },
      { text: ' · ', tone: 'dim' },
      { text: 'audit', tone: 'accent', cmd: 'audit' },
      { text: '   or press ', tone: 'dim' },
      { text: '/', tone: 'warn' },
      { text: ' and type', tone: 'dim' },
    ],
  ])
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKey)
  void boot()
})
onBeforeUnmount(() => {
  bootAborted = true
  window.removeEventListener('keydown', onGlobalKey)
})
</script>

<template>
  <div class="terminal panel" @click="focusField">
    <div class="panel-head">
      <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="title">{{ PROMPT_USER }}@{{ PROMPT_HOST }}: ~</span>
      <span class="tty"><span class="pulse-dot"></span>live</span>
    </div>
    <div ref="screen" class="screen mono" role="log" aria-label="Interactive terminal output">
      <div v-for="entry in entries" :key="entry.id">
        <div v-if="entry.input !== undefined" class="row">
          <span class="ps1"><span class="u">{{ PROMPT_USER }}</span><span class="d">@</span><span class="h">{{ PROMPT_HOST }}</span><span class="d">:~$</span></span>
          {{ entry.input }}
        </div>
        <div v-for="(line, i) in entry.lines" :key="i" class="row">
          <template v-if="line.length">
            <template v-for="(seg, j) in line" :key="j">
              <a v-if="seg.href" :href="seg.href" :class="seg.tone" rel="noopener noreferrer" target="_blank" @click.stop>{{ seg.text }}</a>
              <button v-else-if="seg.cmd" type="button" class="cmd" :class="seg.tone" @click.stop="runFromClick(seg.cmd)">{{ seg.text }}</button>
              <span v-else :class="seg.tone">{{ seg.text }}</span>
            </template>
          </template>
          <template v-else>&nbsp;</template>
        </div>
      </div>
      <form class="row input-row" @submit.prevent="run(input)">
        <label for="terminal-input" class="ps1">
          <span class="u">{{ PROMPT_USER }}</span><span class="d">@</span><span class="h">{{ PROMPT_HOST }}</span><span class="d">:~$</span>
          <span class="sr-only">Terminal command</span>
        </label>
        <input
          id="terminal-input"
          ref="field"
          v-model="input"
          :readonly="busy"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          enterkeyhint="go"
          @keydown="onKeydown"
        />
      </form>
    </div>
  </div>
</template>

<style scoped>
.terminal {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 30px 80px -30px rgb(0 0 0 / 0.8),
    0 0 0 1px rgb(var(--accent-rgb) / 0.04),
    0 0 60px -20px rgb(var(--accent-rgb) / 0.15);
  background: rgb(8 11 15 / 0.88);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: text;
}
.title {
  margin: 0 auto;
}
.tty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--accent);
}
.screen {
  height: clamp(320px, 50vh, 440px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 14px 16px 18px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--text);
  scrollbar-width: thin;
  scrollbar-color: var(--line-2) transparent;
}
.row {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  min-height: 1.65em;
}
.ps1 {
  margin-right: 8px;
  white-space: nowrap;
}
.ps1 .u {
  color: var(--accent);
}
.ps1 .h {
  color: var(--info);
}
.ps1 .d {
  color: var(--text-3);
}
.input-row {
  display: flex;
  align-items: baseline;
}
.input-row input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  caret-color: var(--accent);
  caret-shape: block;
}
.cmd {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  cursor: pointer;
  text-decoration: underline dotted rgb(var(--accent-rgb) / 0.4);
  text-underline-offset: 3px;
  white-space: pre;
}
.cmd:hover {
  background: var(--accent-soft);
}

.dim {
  color: var(--text-3);
}
.accent {
  color: var(--accent);
}
.info {
  color: var(--info);
}
.warn {
  color: var(--warn);
}
.crit {
  color: var(--crit);
}
.bold {
  color: #fff;
  font-weight: 700;
}
</style>
