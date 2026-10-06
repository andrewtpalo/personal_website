<script setup lang="ts">
import SectionHeader from './SectionHeader.vue'
import KalmanDemo from './KalmanDemo.vue'
import { education } from '../data/profile'

const { research } = education
const { award } = research
const best = Math.min(...research.results.map((r) => r.medianCm))
</script>

<template>
  <section id="research" class="section">
    <div class="container">
      <SectionHeader
        index="04"
        title="Research roots"
        command="./echoic-flow --sensor=sonar --filter=kalman"
        lede="Before security, signal processing. My ECE thesis used the time-to-contact cue bats use to close on prey, which only works if you can estimate range-rate from noisy sonar."
      />

      <div class="grid">
        <div v-reveal class="side">
          <div class="panel thesis">
            <p class="mono kicker">thesis · {{ research.date }}</p>
            <h3>{{ research.title }}</h3>
            <p class="advisor mono">advisors: {{ research.advisors.join(', ') }}</p>
            <p class="summary">{{ research.summary }}</p>
            <div class="math mono">
              <p><span class="k">τ</span> = r / ṙ <span class="c">// time to contact</span></p>
              <p><span class="k">dτ/dt</span> = 0.5 <span class="c">// stop exactly at the target</span></p>
              <p><span class="k">x̂</span> = [r, ṙ]ᵀ <span class="c">// filter state</span></p>
            </div>
            <p class="links mono">
              <a :href="research.thesisUrl" rel="noopener noreferrer" target="_blank">read the thesis ↗</a>
              <span class="sep" aria-hidden="true">·</span>
              <a :href="award.url" rel="noopener noreferrer" target="_blank">{{ award.place.toLowerCase() }}, OSU undergraduate research forum, {{ award.date.slice(-4) }} ↗</a>
            </p>
          </div>

          <div class="panel results">
            <div class="panel-head">
              <span class="mono">results.csv</span>
              <span class="mono n">1,000 simulated descents per filter</span>
            </div>
            <table class="mono">
              <thead>
                <tr>
                  <th scope="col">filter</th>
                  <th scope="col">median error</th>
                  <th scope="col">spread (σ)</th>
                  <th scope="col" class="opt">runs &lt; 10 cm</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in research.results" :key="r.method" :class="{ best: r.medianCm === best }">
                  <th scope="row">{{ r.method }}</th>
                  <td>{{ r.medianCm.toFixed(2) }} cm</td>
                  <td>{{ r.spreadCm.toFixed(2) }} cm</td>
                  <td class="opt">{{ r.under10 }}%</td>
                </tr>
              </tbody>
            </table>
            <p class="foot">
              The Kalman filter cut median descent error by 71% versus no filter and made landings far more consistent
              (spread 11.97 cm vs. 48.14 cm for regression).
            </p>
          </div>
        </div>

        <div v-reveal class="demo-wrap">
          <KalmanDemo class="demo" />
          <p class="hint">
            The same idea, live: a constant-velocity Kalman filter sampling at the drone's 15 Hz during a dτ/dt = 0.5
            descent. Differentiating raw sonar amplifies noise by about √2/Δt; the filter recovers range-rate anyway.
            Drag the sliders and compare the <span class="raw">red</span> trace with the <span class="kf">green</span> one.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 14px;
  font-size: 12px;
}
.links a {
  color: var(--text-3);
}
.links a:hover {
  color: var(--accent);
}
.sep {
  color: var(--text-3);
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr);
  gap: 16px;
  align-items: start;
}
.side {
  display: grid;
  gap: 16px;
  min-width: 0;
}
.results {
  overflow-x: auto;
}
.thesis {
  padding: 22px;
}
.kicker {
  font-size: 12px;
  color: var(--warn);
  margin-bottom: 8px;
}
h3 {
  font-size: 20px;
  line-height: 1.3;
}
.advisor {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-3);
}
.summary {
  margin-top: 12px;
  font-size: 15px;
  color: var(--text-2);
}
.math {
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--bg);
  font-size: 13px;
  display: grid;
  gap: 4px;
}
.k {
  color: var(--accent);
}
.c {
  color: var(--text-3);
}

.results .n {
  margin-left: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
th,
td {
  padding: 9px 12px;
  text-align: right;
  white-space: nowrap;
}
thead th {
  white-space: normal;
  vertical-align: bottom;
  font-weight: 500;
  color: var(--text-3);
  border-bottom: 1px solid var(--line);
}
tbody th {
  text-align: left;
  font-weight: 500;
  color: var(--text-2);
}
thead th:first-child {
  text-align: left;
}
tbody tr + tr {
  border-top: 1px solid var(--line);
}
td {
  color: var(--text-2);
}
tr.best th,
tr.best td {
  color: var(--accent);
  background: var(--accent-soft);
  font-weight: 700;
}
.results .foot {
  padding: 12px 14px 14px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--text-3);
}

.demo-wrap {
  min-width: 0;
  display: grid;
  gap: 12px;
}
.hint {
  font-size: 14px;
  color: var(--text-3);
  padding: 0 4px;
}
.raw {
  color: var(--crit);
}
.kf {
  color: var(--accent);
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 520px) {
  .results .n,
  .opt {
    display: none;
  }
  th,
  td {
    padding: 8px 8px;
  }
}
</style>
