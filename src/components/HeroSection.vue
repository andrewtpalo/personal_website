<script setup lang="ts">
import NetworkCanvas from './NetworkCanvas.vue'
import TerminalWindow from './TerminalWindow.vue'
import DecryptText from './DecryptText.vue'
import { profile } from '../data/profile'
</script>

<template>
  <section class="hero" aria-labelledby="hero-title">
    <NetworkCanvas />
    <div class="container grid">
      <div class="copy">
        <p class="status chip chip--accent">
          <span class="pulse-dot" aria-hidden="true"></span>
          {{ profile.title }}
        </p>
        <h1 id="hero-title"><DecryptText :text="profile.name" /></h1>
        <p class="tagline">
          I build the security platforms that <span class="hl">drive down cyber risk</span>.
        </p>
        <p class="intro">{{ profile.intro }}</p>
        <ul class="focus" aria-label="Focus areas">
          <li v-for="f in profile.focus" :key="f" class="chip">{{ f }}</li>
        </ul>
        <div class="ctas">
          <a class="btn btn--primary" href="#platform">
            explore the platform
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
          </a>
          <a class="btn" :href="profile.resume" download>resume.pdf</a>
          <a class="btn" :href="profile.github" rel="noopener noreferrer" target="_blank">github</a>
        </div>
      </div>
      <TerminalWindow class="term" />
    </div>
    <div class="container">
      <dl class="stats">
        <div v-for="s in profile.stats" :key="s.label" v-reveal class="stat">
          <dt class="mono">{{ s.value }}</dt>
          <dd>{{ s.label }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  padding: clamp(40px, 8vh, 96px) 0 clamp(56px, 8vh, 88px);
  margin-top: calc(-1 * var(--nav-h));
  padding-top: calc(var(--nav-h) + clamp(40px, 8vh, 96px));
  overflow: hidden;
}
.grid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: clamp(32px, 5vw, 64px);
  align-items: center;
}
.copy {
  min-width: 0;
}
.status {
  margin-bottom: 22px;
}
h1 {
  font-size: clamp(44px, 6.6vw, 84px);
  font-weight: 750;
  letter-spacing: -0.045em;
  line-height: 0.95;
  color: var(--text);
}
/* Gradient lives on DecryptText's visible layer; clipping on the h1 misses absolutely-positioned text. */
h1 :deep(.live) {
  background: linear-gradient(180deg, #fff 30%, #9fb0c3);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.tagline {
  margin-top: 20px;
  font-size: clamp(20px, 2.4vw, 26px);
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: -0.01em;
}
.hl {
  color: var(--accent);
  text-shadow: 0 0 24px var(--accent-glow);
}
.intro {
  margin-top: 16px;
  max-width: 580px;
  color: var(--text-2);
}
.focus {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 22px 0 0;
  padding: 0;
  list-style: none;
}
.ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}
.term {
  min-width: 0;
}
.stats {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: clamp(48px, 7vh, 80px) 0 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgb(12 17 23 / 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.stat {
  padding: 20px 22px;
  border-left: 1px solid var(--line);
}
.stat:first-child {
  border-left: 0;
}
.stat dt {
  font-size: clamp(26px, 3vw, 34px);
  font-weight: 700;
  color: var(--accent);
  letter-spacing: -0.03em;
}
.stat dd {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.4;
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .stat:nth-child(3) {
    border-left: 0;
  }
  .stat:nth-child(n + 3) {
    border-top: 1px solid var(--line);
  }
}
</style>
