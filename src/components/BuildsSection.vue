<script setup lang="ts">
import SectionHeader from './SectionHeader.vue'
import AgentPattern from './AgentPattern.vue'
import { builds } from '../data/profile'
</script>

<template>
  <section id="builds" class="section">
    <div class="container">
      <SectionHeader
        index="03"
        title="Independent builds"
        command="ls ~/builds"
        lede="Outside the day job I design and ship my own products: security-first, cloud-native, and increasingly agentic."
      />

      <div class="grid">
        <article v-for="b in builds" :key="b.name" v-reveal class="panel build">
          <header class="build-head">
            <h3>{{ b.name }}</h3>
            <span class="chip chip--accent">{{ b.role }}</span>
          </header>
          <p class="summary">{{ b.summary }}</p>
          <ul class="points">
            <li v-for="(p, i) in b.points" :key="i">{{ p }}</li>
          </ul>
          <ul class="stack" aria-label="Stack">
            <li v-for="t in b.stack" :key="t" class="chip">{{ t }}</li>
          </ul>
        </article>
      </div>

      <div v-reveal class="pattern">
        <div class="pattern-copy">
          <p class="mono kicker">design pattern</p>
          <h3>Agents you can actually trust</h3>
          <p>
            Agentic systems are only enterprise-ready if every action is reviewable and attributable. The pattern I
            build around: leaders decompose work for specialists, any consequential action stops at a
            <strong>human-in-the-loop approval gate</strong>, and everything is written to an
            <strong>append-only audit log</strong>.
          </p>
        </div>
        <AgentPattern />
      </div>
    </div>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.build {
  display: flex;
  flex-direction: column;
  padding: clamp(20px, 3vw, 28px);
  transition:
    border-color 0.3s,
    transform 0.3s;
}
.build:hover {
  border-color: rgb(var(--accent-rgb) / 0.3);
}
.build-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
h3 {
  font-size: 24px;
  font-weight: 650;
}
.summary {
  margin-top: 10px;
  font-size: 17px;
  color: var(--text);
}
.points {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  color: var(--text-2);
}
.points li {
  position: relative;
  padding-left: 20px;
}
.points li::before {
  content: '›';
  position: absolute;
  left: 2px;
  color: var(--accent);
  font-family: var(--mono);
}
.stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: auto 0 0;
  padding: 20px 0 0;
  list-style: none;
}
.pattern {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.4fr);
  gap: clamp(24px, 4vw, 48px);
  align-items: center;
  margin-top: clamp(40px, 6vw, 64px);
}
.kicker {
  font-size: 12px;
  color: var(--warn);
  margin-bottom: 8px;
}
.pattern-copy h3 {
  font-size: clamp(22px, 2.6vw, 28px);
  margin-bottom: 12px;
}
.pattern-copy p:not(.kicker) {
  color: var(--text-2);
}
.pattern-copy strong {
  color: var(--text);
}
@media (max-width: 900px) {
  .grid,
  .pattern {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
