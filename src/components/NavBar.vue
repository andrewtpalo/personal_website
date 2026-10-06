<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { sections } from '../data/sections'
import { profile } from '../data/profile'
import { ui } from '../lib/ui'

const active = ref('')
const scrolled = ref(false)
const progress = ref(0)
const isMac = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)
let io: IntersectionObserver | null = null

const onScroll = () => {
  scrolled.value = window.scrollY > 8
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? Math.min(1, window.scrollY / max) : 0
}

onMounted(() => {
  // Scroll-spy: the section crossing the upper third of the viewport is "active".
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) active.value = e.target.id
    },
    { rootMargin: '-30% 0px -65% 0px' },
  )
  for (const s of sections) {
    const el = document.getElementById(s.id)
    if (el) io.observe(el)
  }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  io?.disconnect()
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <nav class="nav" :class="{ scrolled }" aria-label="Primary">
    <div class="container inner">
      <a href="#top" class="brand mono" aria-label="Andrew Palo, back to top">
        <span class="user">andrew</span><span class="at">@</span><span class="host">palo</span><span class="path">:~$</span>
        <span class="caret" aria-hidden="true"></span>
      </a>
      <ul class="links mono">
        <li v-for="s in sections" :key="s.id">
          <a :href="`#${s.id}`" :class="{ active: active === s.id }" :aria-current="active === s.id ? 'true' : undefined">
            <span class="slash">~/</span>{{ s.label }}
          </a>
        </li>
      </ul>
      <button type="button" class="btn palette-btn" aria-label="Open command palette" @click="ui.paletteOpen = true">
        <kbd>{{ isMac ? '⌘' : 'Ctrl' }}</kbd><kbd>K</kbd>
      </button>
      <a class="btn btn--primary resume" :href="profile.resume" download>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14" /></svg>
        resume
      </a>
    </div>
    <div class="progress" aria-hidden="true" :style="{ transform: `scaleX(${progress})` }"></div>
  </nav>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  height: var(--nav-h);
  border-bottom: 1px solid transparent;
  transition:
    background 0.3s,
    border-color 0.3s;
}
.nav.scrolled {
  background: rgb(6 8 11 / 0.78);
  backdrop-filter: blur(14px) saturate(1.4);
  -webkit-backdrop-filter: blur(14px) saturate(1.4);
  border-bottom-color: var(--line);
}
.inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 20px;
}
.brand {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
}
.brand:hover {
  text-decoration: none;
}
.user {
  color: var(--accent);
}
.at,
.path {
  color: var(--text-3);
}
.host {
  color: var(--info);
}
.caret {
  width: 8px;
  height: 16px;
  margin-left: 6px;
  background: var(--accent);
  animation: blink 1.1s steps(1) infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
.links {
  display: flex;
  gap: 2px;
  margin: 0 0 0 auto;
  padding: 0;
  list-style: none;
  font-size: 13px;
  overflow-x: auto;
  scrollbar-width: none;
  min-width: 0;
}
.links::-webkit-scrollbar {
  display: none;
}
.links a {
  display: block;
  padding: 6px 10px;
  border-radius: 6px;
  color: var(--text-2);
  white-space: nowrap;
  transition:
    color 0.2s,
    background 0.2s;
}
.links a:hover {
  color: var(--text);
  background: rgb(255 255 255 / 0.04);
  text-decoration: none;
}
.links a.active {
  color: var(--accent);
  background: var(--accent-soft);
}
.slash {
  color: var(--text-3);
}
.resume {
  height: 34px;
  padding: 0 12px;
  flex: none;
}
.palette-btn {
  height: 34px;
  padding: 0 8px;
  gap: 3px;
  flex: none;
  background: transparent;
}
.palette-btn kbd {
  border-bottom-width: 1px;
}
.progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), var(--info));
  box-shadow: 0 0 10px var(--accent-glow);
  transform-origin: 0 50%;
  pointer-events: none;
}

@media (max-width: 900px) {
  .slash {
    display: none;
  }
}
@media (max-width: 720px) {
  .links {
    display: none;
  }
  .palette-btn {
    margin-left: auto;
  }
}
</style>
