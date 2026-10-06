<script setup lang="ts">
import { ref } from 'vue'
import { email, profile } from '../data/profile'

// The address is assembled only on request, so it never sits in the DOM for scrapers.
const address = ref<string | null>(null)
const commit = __BUILD_COMMIT__
const built = __BUILD_TIME__.slice(0, 10)
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="cta panel">
        <div>
          <p class="mono kicker">$ ./contact</p>
          <h2>Building something that needs to be secure?</h2>
          <p class="sub">{{ profile.location }}</p>
        </div>
        <div class="actions">
          <a v-if="address" class="btn btn--primary" :href="`mailto:${address}`">{{ address }}</a>
          <button v-else type="button" class="btn btn--primary" @click="address = email()">reveal email</button>
          <a class="btn" :href="profile.github" rel="noopener noreferrer" target="_blank">github</a>
          <a class="btn" :href="profile.resume" download>resume.pdf</a>
        </div>
      </div>

      <div class="meta mono">
        <span>© {{ new Date().getFullYear() }} {{ profile.name }}</span>
        <span class="sep" aria-hidden="true">·</span>
        <span>build <span class="hash">{{ commit }}</span> · {{ built }}</span>
        <span class="sep" aria-hidden="true">·</span>
        <span>Vue 3 + Vite + TypeScript · strict CSP · 0 trackers</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding: 24px 0 40px;
}
.cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: clamp(24px, 4vw, 40px);
  border-color: rgb(var(--accent-rgb) / 0.2);
  background:
    radial-gradient(600px 200px at 0% 0%, rgb(var(--accent-rgb) / 0.08), transparent 70%),
    linear-gradient(180deg, var(--panel-2), var(--panel));
}
.kicker {
  font-size: 13px;
  color: var(--warn);
  margin-bottom: 8px;
}
h2 {
  font-size: clamp(24px, 3.2vw, 34px);
  font-weight: 650;
  max-width: 560px;
}
.sub {
  margin-top: 8px;
  color: var(--text-2);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 28px;
  font-size: 12px;
  color: var(--text-3);
}
.hash {
  color: var(--warn);
}
@media (max-width: 640px) {
  .sep {
    display: none;
  }
  .meta {
    flex-direction: column;
  }
}
</style>
