<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { profile } from '../data/profile'
import { sections } from '../data/sections'
import { ACCENTS, accent, copyEmail, downloadResume, focusTerminal, goTo, setAccent, toast, ui } from '../lib/ui'

interface Item {
  id: string
  label: string
  group: 'go to' | 'action' | 'theme'
  keywords?: string
  run: () => void
}

const items = computed<Item[]>(() => [
  { id: 'top', label: 'Top', group: 'go to', keywords: 'home hero', run: () => goTo('top') },
  ...sections.map<Item>((s) => ({ id: `go-${s.id}`, label: s.label[0]!.toUpperCase() + s.label.slice(1), group: 'go to', run: () => goTo(s.id) })),
  { id: 'resume', label: 'Download resume', group: 'action', keywords: 'cv pdf', run: downloadResume },
  { id: 'email', label: 'Copy email address', group: 'action', keywords: 'contact mail', run: () => void copyEmail() },
  { id: 'github', label: 'Open GitHub', group: 'action', keywords: 'code repo', run: () => window.open(profile.github, '_blank', 'noopener,noreferrer') },
  { id: 'terminal', label: 'Focus terminal', group: 'action', keywords: 'shell console cli', run: focusTerminal },
  {
    id: 'audit',
    label: 'Run security self-audit',
    group: 'action',
    keywords: 'csp trusted types privacy',
    run: () => {
      goTo('privacy')
      setTimeout(() => document.querySelector<HTMLButtonElement>('#privacy .foot .btn')?.click(), 500)
    },
  },
  { id: 'kalman', label: 'Play with the Kalman filter', group: 'action', keywords: 'research demo uav', run: () => goTo('research') },
  ...ACCENTS.map<Item>((a) => ({
    id: `theme-${a}`,
    label: `Accent: ${a}${accent.value === a ? '  (current)' : ''}`,
    group: 'theme',
    keywords: 'color theme',
    run: () => {
      setAccent(a)
      toast(`accent → ${a}`)
    },
  })),
])

const query = ref('')
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)
let returnFocus: HTMLElement | null = null

/** Subsequence fuzzy match. Lower is better; contiguous and early matches score best. */
function score(item: Item, q: string): number | null {
  if (!q) return 0
  const hay = `${item.label} ${item.group} ${item.keywords ?? ''}`.toLowerCase()
  let pos = -1
  let cost = 0
  for (const ch of q) {
    const next = hay.indexOf(ch, pos + 1)
    if (next < 0) return null
    cost += next - pos - 1
    pos = next
  }
  return cost + (hay.startsWith(q) ? -100 : 0)
}

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  return items.value
    .map((item) => ({ item, s: score(item, q) }))
    .filter((r): r is { item: Item; s: number } => r.s !== null)
    .sort((a, b) => a.s - b.s)
    .map((r) => r.item)
})

watch(query, () => (active.value = 0))

function open() {
  returnFocus = document.activeElement as HTMLElement | null
  query.value = ''
  active.value = 0
  ui.paletteOpen = true
}
function close() {
  ui.paletteOpen = false
}

watch(
  () => ui.paletteOpen,
  async (isOpen) => {
    document.documentElement.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) {
      if (!returnFocus) returnFocus = document.activeElement as HTMLElement | null
      await nextTick()
      input.value?.focus()
    } else {
      returnFocus?.focus?.({ preventScroll: true })
      returnFocus = null
    }
  },
)

function run(item: Item | undefined) {
  if (!item) return
  close()
  item.run()
}

async function onKey(e: KeyboardEvent) {
  const n = results.value.length
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    active.value = n ? (active.value + 1) % n : 0
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    active.value = n ? (active.value - 1 + n) % n : 0
  } else if (e.key === 'Enter') {
    e.preventDefault()
    run(results.value[active.value])
  } else if (e.key === 'Escape') {
    e.preventDefault()
    close()
  } else if (e.key === 'Tab') {
    e.preventDefault() // keep focus inside the dialog
    return
  }
  await nextTick()
  document.getElementById(`pal-${results.value[active.value]?.id}`)?.scrollIntoView({ block: 'nearest' })
}

function onGlobalKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (ui.paletteOpen) close()
    else open()
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey))

</script>

<template>
  <Teleport to="body">
    <Transition name="pal">
      <div v-if="ui.paletteOpen" class="overlay" @mousedown.self="close">
        <div class="palette panel" role="dialog" aria-modal="true" aria-label="Command palette">
          <div class="search">
            <span class="chev mono" aria-hidden="true">›</span>
            <input
              ref="input"
              v-model="query"
              class="mono"
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls="pal-list"
              aria-autocomplete="list"
              :aria-activedescendant="results[active] ? `pal-${results[active]!.id}` : undefined"
              placeholder="jump to a section, run an action, change theme…"
              autocomplete="off"
              spellcheck="false"
              @keydown="onKey"
            />
            <kbd>esc</kbd>
          </div>
          <ul id="pal-list" role="listbox" class="list">
            <li
              v-for="(item, i) in results"
              :id="`pal-${item.id}`"
              :key="item.id"
              role="option"
              :aria-selected="i === active"
              :class="{ active: i === active }"
              @mousemove="active = i"
              @click="run(item)"
            >
              <span class="label">{{ item.label }}</span>
              <span class="group mono">{{ item.group }}</span>
            </li>
            <li v-if="!results.length" class="empty mono">no matches</li>
          </ul>
          <div class="foot mono">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> run</span>
            <span class="tip">try ↑↑↓↓←→←→BA</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 14vh 16px 16px;
  background: rgb(3 5 8 / 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.palette {
  width: min(600px, 100%);
  overflow: hidden;
  box-shadow:
    0 40px 120px -20px rgb(0 0 0 / 0.9),
    0 0 0 1px rgb(var(--accent-rgb) / 0.15);
}
.palette::after {
  display: none;
}
.search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border-bottom: 1px solid var(--line);
}
.chev {
  color: var(--accent);
  font-size: 18px;
}
.search input {
  flex: 1;
  min-width: 0;
  height: 52px;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
  font-size: 14px;
  caret-color: var(--accent);
}
.search input::placeholder {
  color: var(--text-3);
}
.list {
  max-height: min(380px, 50vh);
  overflow-y: auto;
  margin: 0;
  padding: 6px;
  list-style: none;
}
.list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-2);
}
.list li.active {
  background: var(--accent-soft);
  color: var(--text);
  box-shadow: inset 2px 0 0 var(--accent);
}
.group {
  font-size: 11px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.empty {
  justify-content: center;
  cursor: default;
  color: var(--text-3);
}
.foot {
  display: flex;
  gap: 16px;
  padding: 10px 14px;
  border-top: 1px solid var(--line);
  font-size: 11px;
  color: var(--text-3);
}
.foot kbd {
  margin-right: 3px;
}
.tip {
  margin-left: auto;
}
.pal-enter-active,
.pal-leave-active {
  transition: opacity 0.18s ease;
}
.pal-enter-active .palette,
.pal-leave-active .palette {
  transition: transform 0.18s ease;
}
.pal-enter-from,
.pal-leave-to {
  opacity: 0;
}
.pal-enter-from .palette,
.pal-leave-to .palette {
  transform: translateY(-8px) scale(0.98);
}
@media (max-width: 520px) {
  .tip {
    display: none;
  }
}
</style>
