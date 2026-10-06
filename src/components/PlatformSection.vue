<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SectionHeader from './SectionHeader.vue'
import RiskMatrix from './RiskMatrix.vue'
import { platform } from '../data/profile'
import { useReducedMotion, useVisibleAnimation } from '../composables/motion'

const reduced = useReducedMotion()
const pipelineEl = ref<HTMLElement | null>(null)

// CI pipeline animation: each stage runs for STAGE_S, then the run holds green before restarting.
const STAGE_S = 0.9
const HOLD_S = 2.6
const clock = ref(0)
const motion = computed(() => !reduced.value)
useVisibleAnimation(pipelineEl, (dt) => {
  clock.value = (clock.value + dt) % (platform.delivery.length * STAGE_S + HOLD_S)
}, motion)
watch(reduced, (r) => r && (clock.value = platform.delivery.length * STAGE_S))

const running = computed(() => Math.floor(clock.value / STAGE_S))
const stageStatus = (i: number) => (i < running.value ? 'passed' : i === running.value ? 'running' : 'pending')
const pipelineDone = computed(() => running.value >= platform.delivery.length)

const stageNote: Record<string, string> = {
  'GitLab CI/CD': 'build · test',
  'Terraform (IaC)': 'plan · apply',
  Docker: 'image build',
  Kubernetes: 'rollout',
  'Google Cloud': 'serve',
}
</script>

<template>
  <section id="platform" class="section">
    <div class="container">
      <SectionHeader
        index="02"
        title="The platform I built"
        command="cat architecture.md | less"
        lede="Fiserv's enterprise cybersecurity metrics & analytics platform: the company-wide source of truth for security reporting, and the engine that turns raw findings into risk scores so remediation goes where it cuts the most cyber risk. I conceived, architected, and own it end to end."
      />

      <div v-reveal class="diagram" role="group" aria-label="Platform architecture: signal sources feed the platform, which serves security, engineering, and leadership">
        <!-- Sources -->
        <div class="col sources">
          <p class="col-label mono">ingest</p>
          <div v-for="g in platform.sources" :key="g.group" class="panel box">
            <p class="box-title mono">{{ g.group }}</p>
            <ul class="tools">
              <li v-for="t in g.items" :key="t" class="chip">{{ t }}</li>
            </ul>
          </div>
        </div>

        <div class="bus" aria-hidden="true">
          <span v-for="i in 6" :key="i" class="pkt" :style="{ '--lane': (i * 15) + '%', '--delay': (i * -0.37) + 's' }"></span>
        </div>

        <!-- Core -->
        <div class="col core">
          <p class="col-label mono">platform</p>
          <div class="panel box core-box">
            <div class="core-head">
              <span class="pulse-dot" aria-hidden="true"></span>
              <span class="mono">security-analytics</span>
              <span class="chip chip--accent">prod</span>
            </div>
            <div v-for="l in platform.layers" :key="l.id" class="layer">
              <div class="layer-top">
                <span class="layer-label">{{ l.label }}</span>
                <span class="layer-tech mono">{{ l.tech.join(' · ') }}</span>
              </div>
              <p class="layer-detail">{{ l.detail }}</p>
            </div>
            <ul class="guardrails">
              <li v-for="g in platform.guardrails" :key="g" class="chip chip--info">{{ g }}</li>
            </ul>
          </div>
        </div>

        <div class="bus" aria-hidden="true">
          <span v-for="i in 5" :key="i" class="pkt" :style="{ '--lane': (i * 17) + '%', '--delay': (i * -0.53) + 's' }"></span>
        </div>

        <!-- Consumers -->
        <div class="col consumers">
          <p class="col-label mono">serve</p>
          <div class="panel box dau">
            <span class="dau-num mono">200+</span>
            <span class="dau-label">daily active users</span>
            <span class="dau-sub">thousands of daily pageviews · thousands of monthly uniques</span>
          </div>
          <ul class="personas">
            <li v-for="c in platform.consumers" :key="c" class="panel persona">
              <span class="mono">→</span> {{ c }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Risk scoring -->
      <div class="risk-block">
        <div v-reveal class="risk-copy">
          <p class="mono kicker">risk scoring</p>
          <h3>Turning findings into risk reduction</h3>
          <p>
            Raw findings don't tell anyone what to fix first. I designed the platform's risk scoring algorithms around
            <strong>likelihood × impact</strong>: every application, endpoint, person, and account gets a score, and the
            scores roll up into an overall risk posture.
          </p>
          <p>
            The result is a ranked, defensible answer to "what should we fix next?" Remediation effort goes to the exposures
            that <strong>reduce the most cyber risk</strong>, and security, engineering, and leadership all read risk in the
            same language.
          </p>
          <ul class="kinds">
            <li class="chip">applications</li>
            <li class="chip">endpoints</li>
            <li class="chip">people</li>
            <li class="chip">accounts</li>
            <li class="chip chip--accent">overall posture</li>
          </ul>
        </div>
        <RiskMatrix v-reveal class="risk-demo" />
      </div>

      <!-- Delivery -->
      <div ref="pipelineEl" v-reveal class="panel pipeline">
        <div class="panel-head">
          <span class="mono">pipeline</span>
          <span class="pipe-status" :class="pipelineDone ? 'ok' : 'run'">
            {{ pipelineDone ? '● passed' : '◌ running' }}
          </span>
          <span class="pipe-meta">secure SDLC · Infrastructure-as-Code · GitOps</span>
        </div>
        <ol class="stages">
          <li v-for="(stage, i) in platform.delivery" :key="stage" class="stage" :class="stageStatus(i)">
            <span class="icon" aria-hidden="true"></span>
            <span class="stage-name">{{ stage }}</span>
            <span class="stage-note mono">{{ stageNote[stage] }}</span>
            <span class="sr-only">{{ stageStatus(i) }}</span>
          </li>
        </ol>
      </div>

      <div class="also">
        <div v-reveal class="panel also-card">
          <p class="mono kicker">also</p>
          <p>
            <strong>Architecture SME</strong> for a second enterprise application (Next.js on GCP), leading
            security and architecture design reviews and guiding scalable, secure design decisions.
          </p>
        </div>
        <div v-reveal class="panel also-card">
          <p class="mono kicker">and</p>
          <p>
            <strong>Vulnerability management</strong> across the estate: triaging cloud, endpoint, AppSec, and SIEM findings and
            partnering with engineering teams to prioritize and close risk.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.diagram {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1.35fr) 56px minmax(0, 0.9fr);
  align-items: start;
}
.col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.col-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-3);
}
.box {
  padding: 16px;
}
.box-title {
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 12px;
}
.tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Animated data bus between columns. */
.bus {
  position: relative;
  align-self: stretch;
  margin: 30px 0 0;
  overflow: hidden;
}
.bus::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, var(--line-2) 0 4px, transparent 4px 9px) center / 100% 1px no-repeat;
}
.pkt {
  position: absolute;
  top: var(--lane);
  left: 0;
  width: 14px;
  height: 2px;
  border-radius: 2px;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
  animation: flow-x 1.8s linear infinite;
  animation-delay: var(--delay);
}
@keyframes flow-x {
  from {
    left: -14px;
  }
  to {
    left: 100%;
  }
}

.core-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  border-color: rgb(var(--accent-rgb) / 0.28);
  box-shadow: 0 0 60px -30px var(--accent-glow);
}
.core-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  margin-bottom: 4px;
}
.core-head .chip {
  margin-left: auto;
}
.layer {
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgb(255 255 255 / 0.015);
}
.layer-top {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 12px;
}
.layer-label {
  font-weight: 600;
}
.layer-tech {
  font-size: 12px;
  color: var(--accent);
}
.layer-detail {
  margin-top: 4px;
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.5;
}
.guardrails {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}

.dau {
  display: flex;
  flex-direction: column;
}
.dau-num {
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
  color: var(--accent);
  letter-spacing: -0.04em;
}
.dau-label {
  margin-top: 6px;
  font-weight: 600;
}
.dau-sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-3);
  line-height: 1.45;
}
.personas {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.persona {
  padding: 10px 14px;
  font-size: 14px;
}
.persona .mono {
  color: var(--accent);
}

.risk-block {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.3fr);
  gap: clamp(24px, 4vw, 48px);
  align-items: center;
  margin-top: clamp(40px, 6vw, 64px);
}
.risk-copy h3 {
  font-size: clamp(22px, 2.6vw, 28px);
  margin-bottom: 12px;
}
.risk-copy p:not(.kicker) {
  color: var(--text-2);
}
.risk-copy p + p {
  margin-top: 12px;
}
.risk-copy strong {
  color: var(--text);
}
.kinds {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}
.risk-demo {
  min-width: 0;
}
.pipeline {
  margin-top: clamp(40px, 6vw, 64px);
}
.pipe-status {
  font-size: 12px;
}
.pipe-status.ok {
  color: var(--accent);
}
.pipe-status.run {
  color: var(--warn);
}
.pipe-meta {
  margin-left: auto;
}
.stages {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin: 0;
  padding: 18px;
  gap: 10px;
  list-style: none;
  counter-reset: stage;
}
.stage {
  position: relative;
  display: grid;
  grid-template-columns: 22px 1fr;
  grid-template-rows: auto auto;
  column-gap: 10px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  transition:
    border-color 0.3s,
    background 0.3s;
}
.stage + .stage::before {
  content: '';
  position: absolute;
  left: -11px;
  top: 50%;
  width: 10px;
  height: 1px;
  background: var(--line-2);
}
.icon {
  grid-row: span 2;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  border-radius: 50%;
  border: 2px solid var(--line-2);
}
.stage-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stage-note {
  font-size: 11px;
  color: var(--text-3);
}
.stage.passed {
  border-color: rgb(var(--accent-rgb) / 0.3);
}
.stage.passed .icon {
  border-color: var(--accent);
  background: var(--accent)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2304140e' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 12 5 5L20 7'/%3E%3C/svg%3E")
    center / 12px no-repeat;
}
.stage.running {
  border-color: rgb(255 180 84 / 0.45);
  background: var(--warn-soft);
}
.stage.running .icon {
  border-color: var(--warn);
  border-right-color: transparent;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.stage.pending {
  opacity: 0.55;
}

.also {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}
.also-card {
  padding: 20px 22px;
  color: var(--text-2);
}
.also-card strong {
  color: var(--text);
}
.kicker {
  font-size: 12px;
  color: var(--warn);
  margin-bottom: 6px;
}

@media (max-width: 960px) {
  .diagram,
  .risk-block {
    grid-template-columns: minmax(0, 1fr);
  }
  .bus {
    height: 44px;
    margin: 6px 0;
  }
  .bus::before {
    background: repeating-linear-gradient(180deg, var(--line-2) 0 4px, transparent 4px 9px) center / 1px 100% no-repeat;
  }
  .pkt {
    top: 0;
    left: var(--lane);
    width: 2px;
    height: 12px;
    animation-name: flow-y;
  }
  @keyframes flow-y {
    from {
      top: -12px;
    }
    to {
      top: 100%;
    }
  }
  .stages {
    grid-template-columns: minmax(0, 1fr);
  }
  .stage + .stage::before {
    left: 22px;
    top: -11px;
    width: 1px;
    height: 10px;
  }
  .also {
    grid-template-columns: 1fr;
  }
  .pipe-meta {
    display: none;
  }
}
</style>
