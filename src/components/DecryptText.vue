<script setup lang="ts">
/** Renders text that "decrypts" from random glyphs, left to right. */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ text: string; duration?: number; delay?: number }>(), {
  duration: 1100,
  delay: 150,
})

const GLYPHS = 'ABCDEF0123456789#$%&*+=<>/\\|{}[]'
const shown = ref(props.text)
let raf = 0

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const start = performance.now() + props.delay
  const tick = (now: number) => {
    const k = Math.max(0, (now - start) / props.duration)
    const resolved = Math.floor(k * props.text.length)
    shown.value = [...props.text]
      .map((ch, i) => (i < resolved || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
      .join('')
    if (k < 1) raf = requestAnimationFrame(tick)
    else shown.value = props.text
  }
  raf = requestAnimationFrame(tick)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <span class="decrypt">
    <span class="sr-only">{{ text }}</span>
    <span class="ghost" aria-hidden="true">{{ text }}</span>
    <span class="live" aria-hidden="true">{{ shown }}</span>
  </span>
</template>

<style scoped>
/* The invisible copy reserves the final width so scrambling never shifts layout. */
.decrypt {
  position: relative;
  display: inline-block;
  white-space: nowrap;
}
.ghost {
  visibility: hidden;
}
.live {
  position: absolute;
  inset: 0;
  white-space: nowrap;
}
</style>
