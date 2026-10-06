<script setup lang="ts">
import SectionHeader from './SectionHeader.vue'
import { education, timeline, type Role } from '../data/profile'
import { shortHash } from '../lib/shell'

/** Bold the phrases that matter most in each bullet. */
const emphasis = [
  "enterprise's primary cybersecurity metrics & analytics platform",
  '200+ daily active users',
  'risk scoring algorithms',
  'likelihood × impact',
  'reduce the most cyber risk',
  'full secure SDLC',
  'architecture SME',
  'security and architecture design reviews',
  'vulnerability management and remediation tracking',
  'production AI/LLM features',
  'custom VBA tooling',
  'firmwide workload/billings database',
  'Drafted patent applications',
  'Fortune 500 companies',
]

const span = (role: Role) => (role.start === role.end ? role.start : `${role.start} – ${role.end}`)

function highlight(point: string): { text: string; strong: boolean }[] {
  const pattern = new RegExp(`(${emphasis.map((e) => e.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')).join('|')})`, 'g')
  return point
    .split(pattern)
    .filter(Boolean)
    .map((text) => ({ text, strong: emphasis.includes(text) }))
}
</script>

<template>
  <section id="experience" class="section">
    <div class="container">
      <SectionHeader
        index="01"
        title="Experience"
        command="git log --graph --author=&quot;Andrew Palo&quot;"
      />

      <ol class="log">
        <template v-for="entry in timeline" :key="entry.kind === 'role' ? entry.role.title : 'education'">
          <li
            v-if="entry.kind === 'role'"
            v-reveal
            class="commit"
            :class="{ head: entry.role.current, compact: entry.role.compact }"
          >
            <span class="node" aria-hidden="true"></span>
            <div class="panel card">
              <div class="refs mono">
                <span class="hash">{{ shortHash(entry.role.org + entry.role.title) }}</span>
                <span v-if="entry.role.current" class="chip chip--info">HEAD → main</span>
                <span class="when">{{ span(entry.role) }}</span>
              </div>
              <h3>
                {{ entry.role.title }}
                <span class="org">@ {{ entry.role.org }}</span>
              </h3>
              <p v-if="entry.role.orgNote" class="note mono">{{ entry.role.orgNote }}</p>
              <p v-if="entry.role.compact" class="summary">{{ entry.role.points.join(' ') }}</p>
              <ul v-else class="points">
                <li v-for="(p, i) in entry.role.points" :key="i">
                  <template v-for="(part, j) in highlight(p)" :key="j">
                    <strong v-if="part.strong">{{ part.text }}</strong><template v-else>{{ part.text }}</template>
                  </template>
                </li>
              </ul>
              <ul class="stack" aria-label="Stack">
                <li v-for="t in entry.role.stack" :key="t" class="chip">{{ t }}</li>
              </ul>
            </div>
          </li>

          <li v-else v-reveal class="commit compact">
            <span class="node node--tag" aria-hidden="true"></span>
            <div class="panel card">
              <div class="refs mono">
                <span class="hash">{{ shortHash(education.school) }}</span>
                <span class="chip chip--warn">tag: v2020.05</span>
                <span class="when">{{ education.date }}</span>
              </div>
              <h3>
                {{ education.degree }}
                <span class="org">@ {{ education.school }}</span>
              </h3>
              <p class="note mono">{{ education.minor }} · {{ education.honors.join(' · ') }}</p>
            </div>
          </li>
        </template>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.log {
  position: relative;
  margin: 0;
  padding: 0 0 0 36px;
  list-style: none;
}
/* The branch line. */
.log::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 12px;
  bottom: 24px;
  width: 2px;
  background: linear-gradient(180deg, var(--accent), var(--line-2) 40%, var(--line-2));
}
.commit {
  position: relative;
}
.commit + .commit {
  margin-top: 22px;
}
.node {
  position: absolute;
  left: -36px;
  top: 22px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--bg);
  border: 2px solid var(--accent);
  box-shadow: 0 0 0 5px var(--accent-soft);
}
.head .node::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: var(--accent);
}
.node--tag {
  border-color: var(--warn);
  box-shadow: 0 0 0 5px var(--warn-soft);
}
.card {
  padding: clamp(18px, 3vw, 28px);
}
/* Earlier roles and the degree: tighter one-line commits. */
.compact .card {
  padding: 16px clamp(18px, 3vw, 24px);
}
.compact h3 {
  margin-top: 8px;
  font-size: 18px;
}
.compact .node {
  top: 18px;
  border-color: var(--line-2);
  box-shadow: none;
}
.compact .node--tag {
  border-color: var(--warn);
  box-shadow: 0 0 0 5px var(--warn-soft);
}
.summary {
  margin-top: 6px;
  color: var(--text-2);
}
.compact .stack {
  margin-top: 12px;
  padding-top: 0;
  border-top: 0;
}
.refs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.hash {
  color: var(--warn);
}
.when {
  margin-left: auto;
  color: var(--text-3);
}
h3 {
  margin-top: 12px;
  font-size: clamp(20px, 2.4vw, 26px);
  font-weight: 650;
}
.org {
  color: var(--accent);
  font-weight: 500;
}
.note {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-3);
}
.points {
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}
.points li {
  position: relative;
  padding-left: 22px;
  color: var(--text-2);
}
.points li::before {
  content: '+';
  position: absolute;
  left: 0;
  font-family: var(--mono);
  color: var(--accent);
}
.points strong {
  color: var(--text);
  font-weight: 600;
}
.stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 22px 0 0;
  padding: 18px 0 0;
  border-top: 1px dashed var(--line-2);
  list-style: none;
}
@media (max-width: 560px) {
  .log {
    padding-left: 26px;
  }
  .log::before {
    left: 5px;
  }
  .node {
    left: -26px;
    width: 14px;
    height: 14px;
  }
  .head .node::after {
    inset: 2px;
  }
  .when {
    margin-left: 0;
    width: 100%;
  }
}
</style>
