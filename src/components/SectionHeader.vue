<script setup lang="ts">
defineProps<{
  index: string
  title: string
  command: string
  lede?: string
}>()
</script>

<template>
  <header v-reveal class="section-header">
    <div class="meta mono">
      <span class="index">{{ index }}</span>
      <span class="rule" aria-hidden="true"></span>
      <code class="command"><span class="prompt">$</span> {{ command }}</code>
    </div>
    <h2>{{ title }}</h2>
    <p v-if="lede" class="lede">{{ lede }}</p>
  </header>
</template>

<style scoped>
.section-header {
  margin-bottom: clamp(28px, 4vw, 44px);
  max-width: 760px;
}
.meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  font-size: 13px;
  color: var(--text-3);
  min-width: 0;
}
.index {
  color: var(--accent);
}
.rule {
  width: 40px;
  height: 1px;
  background: var(--line-2);
  flex: none;
}
.command {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.prompt {
  color: var(--warn);
}
h2 {
  font-size: clamp(30px, 4.4vw, 46px);
  font-weight: 650;
}
.lede {
  margin-top: 14px;
  color: var(--text-2);
  font-size: 17px;
}
</style>
