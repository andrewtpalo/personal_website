<script setup lang="ts">
import { ui } from '../lib/ui'
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <p v-for="t in ui.toasts" :key="t.id" class="toast mono">
        <span class="dot" aria-hidden="true"></span>{{ t.text }}
      </p>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 300;
  display: grid;
  gap: 8px;
  justify-items: end;
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid rgb(var(--accent-rgb) / 0.35);
  border-radius: 10px;
  background: rgb(12 17 23 / 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-size: 12.5px;
  color: var(--text);
  box-shadow: 0 16px 40px -16px rgb(0 0 0 / 0.8);
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
}
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
