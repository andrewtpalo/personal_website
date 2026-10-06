<script setup lang="ts">
import { computed, ref } from 'vue'
import SectionHeader from './SectionHeader.vue'
import { skills } from '../data/profile'

const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return skills.map((g) => ({
    ...g,
    matches: g.items.map((item) => ({ item, hit: !q || item.toLowerCase().includes(q) || g.label.toLowerCase().includes(q) })),
  }))
})
const hitCount = computed(() => filtered.value.reduce((n, g) => n + g.matches.filter((m) => m.hit).length, 0))
const total = skills.reduce((n, g) => n + g.items.length, 0)

/** Split an item around the query so the match can be highlighted. */
function parts(item: string): { text: string; hit: boolean }[] {
  const q = query.value.trim()
  if (!q) return [{ text: item, hit: false }]
  const i = item.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return [{ text: item, hit: false }]
  return [
    { text: item.slice(0, i), hit: false },
    { text: item.slice(i, i + q.length), hit: true },
    { text: item.slice(i + q.length), hit: false },
  ].filter((p) => p.text)
}
</script>

<template>
  <section id="skills" class="section">
    <div class="container">
      <SectionHeader index="05" title="Skills" command="tree ~/skills | grep -i" />

      <div v-reveal class="panel grep">
        <label for="skill-grep" class="mono prompt">$ grep -i</label>
        <input
          id="skill-grep"
          v-model="query"
          class="mono"
          type="search"
          placeholder="try: terraform, rbac, agent, risk…"
          autocomplete="off"
          spellcheck="false"
        />
        <span class="count mono" aria-live="polite">{{ hitCount }}/{{ total }} match</span>
      </div>

      <div class="groups">
        <div v-for="g in filtered" :key="g.id" v-reveal class="panel group">
          <div class="panel-head">
            <span class="mono gname">{{ g.label.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-') }}/</span>
            <span class="mono gcount">{{ g.matches.filter((m) => m.hit).length }}</span>
          </div>
          <ul class="tree mono">
            <li v-for="(m, i) in g.matches" :key="m.item" :class="{ miss: !m.hit }">
              <span class="branch" aria-hidden="true">{{ i === g.matches.length - 1 ? '└──' : '├──' }}</span>
              <span>
                <template v-for="(p, j) in parts(m.item)" :key="j">
                  <mark v-if="p.hit">{{ p.text }}</mark><template v-else>{{ p.text }}</template>
                </template>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grep {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 16px;
  margin-bottom: 16px;
}
.prompt {
  color: var(--warn);
  font-size: 14px;
  white-space: nowrap;
}
.grep input {
  flex: 1;
  min-width: 0;
  height: 40px;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
  font-size: 14px;
  caret-color: var(--accent);
}
.grep input::placeholder {
  color: var(--text-3);
}
.grep:focus-within {
  border-color: rgb(var(--accent-rgb) / 0.4);
}
.count {
  font-size: 12px;
  color: var(--text-3);
  white-space: nowrap;
}
.groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.gname {
  color: var(--info);
}
.gcount {
  margin-left: auto;
}
.tree {
  margin: 0;
  padding: 14px 16px 18px;
  list-style: none;
  font-size: 13.5px;
  line-height: 1.9;
}
.tree li {
  display: flex;
  gap: 10px;
  transition: opacity 0.2s;
}
.branch {
  color: var(--text-3);
  flex: none;
}
.miss {
  opacity: 0.28;
}
mark {
  background: var(--accent);
  color: var(--accent-ink);
  border-radius: 3px;
  padding: 0 1px;
}
@media (max-width: 800px) {
  .groups {
    grid-template-columns: minmax(0, 1fr);
  }
  .count {
    display: none;
  }
}
</style>
