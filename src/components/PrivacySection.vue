<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SectionHeader from './SectionHeader.vue'
import { activeAudit, passiveAudit, type Finding } from '../lib/audit'
import { collectFingerprint, type Fingerprint } from '../lib/fingerprint'

const findings = ref<Finding[]>([])
const activeRan = ref(false)
const fp = ref<Fingerprint | null>(null)
const revealed = ref(false)

function runActive() {
  findings.value = [...passiveAudit(), ...activeAudit()]
  activeRan.value = true
}

async function reveal() {
  fp.value = await collectFingerprint()
  revealed.value = true
}

onMounted(() => {
  // Resource timing is only complete after load.
  const run = () => (findings.value = passiveAudit())
  if (document.readyState === 'complete') run()
  else window.addEventListener('load', run, { once: true })
})
</script>

<template>
  <section id="privacy" class="section">
    <div class="container">
      <SectionHeader
        index="06"
        title="This page, audited"
        command="./audit --self && ./fingerprint --you"
        lede="A security engineer's site should hold itself to the standard. Every check below runs live in your browser against this page."
      />

      <div class="grid">
        <div v-reveal class="panel audit">
          <div class="panel-head">
            <span class="mono">self-audit</span>
            <span class="mono pass-count">
              {{ findings.filter((f) => f.status === 'pass').length }}/{{ findings.length }} pass
            </span>
          </div>
          <ul class="findings">
            <li v-for="f in findings" :key="f.id" class="finding">
              <span class="badge mono" :class="f.status">{{ f.status }}</span>
              <div>
                <p class="flabel">{{ f.label }}</p>
                <p class="fdetail mono">{{ f.detail }}</p>
              </div>
            </li>
          </ul>
          <div class="foot">
            <button type="button" class="btn" :disabled="activeRan" @click="runActive">
              {{ activeRan ? 'active probes complete' : 'run active probes →' }}
            </button>
            <p class="note">Attempts <code>eval()</code> and a raw <code>innerHTML</code> write, then reports whether the browser blocked them.</p>
          </div>
        </div>

        <div v-reveal class="panel fingerprint">
          <div class="panel-head">
            <span class="mono">what your browser told me</span>
          </div>
          <div v-if="!revealed" class="cta">
            <p>
              Without asking, any site can read dozens of signals from your browser and combine them into an identifier
              that survives clearing cookies. This page doesn't, but here's what it <em>could</em> see.
            </p>
            <button type="button" class="btn btn--primary" @click="reveal">show me my fingerprint</button>
            <p class="note">Computed locally. Never stored, never transmitted, and the CSP blocks connections to any other origin.</p>
          </div>
          <template v-else-if="fp">
            <dl class="signals mono">
              <div v-for="s in fp.signals" :key="s.key">
                <dt>{{ s.key }}</dt>
                <dd>{{ s.value }}</dd>
              </div>
            </dl>
            <div class="hash">
              <p class="mono halg">{{ fp.algorithm }}(signals) =</p>
              <p class="mono hval">{{ fp.hash }}</p>
              <p class="note">
                Typically stable across visits on this device, no cookie required. Mitigations: Tor Browser, Firefox
                <code>resistFingerprinting</code>, or Brave's farbling.
              </p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.pass-count {
  margin-left: auto;
  color: var(--accent);
}
.findings {
  margin: 0;
  padding: 6px 0;
  list-style: none;
}
.finding {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 14px;
  padding: 10px 16px;
  align-items: start;
}
.finding + .finding {
  border-top: 1px solid var(--line);
}
.badge {
  display: inline-block;
  margin-top: 2px;
  padding: 1px 0;
  border-radius: 4px;
  font-size: 11px;
  text-align: center;
  text-transform: uppercase;
  font-weight: 700;
}
.badge.pass {
  color: var(--accent-ink);
  background: var(--accent);
}
.badge.warn {
  color: #1a1000;
  background: var(--warn);
}
.badge.fail {
  color: #fff;
  background: var(--crit);
}
.badge.info {
  color: var(--info);
  background: var(--info-soft);
}
.flabel {
  font-weight: 600;
  font-size: 15px;
}
.fdetail {
  font-size: 12px;
  color: var(--text-3);
  overflow-wrap: anywhere;
}
.foot {
  display: grid;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid var(--line);
}
.foot .btn {
  justify-self: start;
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
  transform: none;
}
.note {
  font-size: 13px;
  color: var(--text-3);
}
.note code {
  color: var(--text-2);
}
.cta {
  display: grid;
  gap: 16px;
  padding: 22px;
  justify-items: start;
}
.cta > p:first-child {
  color: var(--text-2);
}
.signals {
  margin: 0;
  padding: 8px 0;
  font-size: 12.5px;
}
.signals div {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 12px;
  padding: 6px 16px;
}
.signals dt {
  color: var(--info);
}
.signals dd {
  margin: 0;
  color: var(--text);
  overflow-wrap: anywhere;
}
.hash {
  padding: 16px;
  border-top: 1px solid var(--line);
  display: grid;
  gap: 6px;
}
.halg {
  font-size: 12px;
  color: var(--text-3);
}
.hval {
  font-size: 13px;
  color: var(--warn);
  overflow-wrap: anywhere;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 420px) {
  .signals div {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
}
</style>
