<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import HeroSection from './components/HeroSection.vue'
import ExperienceSection from './components/ExperienceSection.vue'
import PlatformSection from './components/PlatformSection.vue'
import BuildsSection from './components/BuildsSection.vue'
import ResearchSection from './components/ResearchSection.vue'
import SkillsSection from './components/SkillsSection.vue'
import PrivacySection from './components/PrivacySection.vue'
import SiteFooter from './components/SiteFooter.vue'
import CommandPalette from './components/CommandPalette.vue'
import ToastHost from './components/ToastHost.vue'
import { accent, setAccent, toast } from './lib/ui'

/** Cursor spotlight: feed pointer coordinates to whichever panel is hovered. */
function onPointerMove(e: PointerEvent) {
  const panel = (e.target as Element | null)?.closest?.<HTMLElement>('.panel')
  if (!panel) return
  const rect = panel.getBoundingClientRect()
  panel.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  panel.style.setProperty('--my', `${e.clientY - rect.top}px`)
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
let progress = 0
let beforeRedTeam = accent.value

function onKey(e: KeyboardEvent) {
  if ((e.target as Element | null)?.closest?.('input, textarea')) return
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
  progress = key === KONAMI[progress] ? progress + 1 : key === KONAMI[0] ? 1 : 0
  if (progress < KONAMI.length) return
  progress = 0
  if (accent.value === 'red') {
    setAccent(beforeRedTeam === 'red' ? 'green' : beforeRedTeam)
    toast('red team mode: disengaged')
  } else {
    beforeRedTeam = accent.value
    setAccent('red')
    toast('red team mode: engaged')
  }
}

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <a class="skip-link" href="#experience">Skip to content</a>
  <NavBar />
  <main id="top">
    <HeroSection />
    <ExperienceSection />
    <PlatformSection />
    <BuildsSection />
    <ResearchSection />
    <SkillsSection />
    <PrivacySection />
  </main>
  <SiteFooter />
  <CommandPalette />
  <ToastHost />
</template>

<style>
.skip-link {
  position: absolute;
  left: 16px;
  top: -48px;
  z-index: 100;
  padding: 8px 12px;
  background: var(--accent);
  color: var(--accent-ink);
  border-radius: var(--radius-sm);
  font-family: var(--mono);
  font-size: 13px;
}
.skip-link:focus {
  top: 12px;
}
</style>
