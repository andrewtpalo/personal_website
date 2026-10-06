import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** Reactive `prefers-reduced-motion`. */
export function useReducedMotion(): Ref<boolean> {
  const reduced = ref(false)
  let query: MediaQueryList | null = null
  const sync = () => (reduced.value = query?.matches ?? false)
  onMounted(() => {
    query = matchMedia('(prefers-reduced-motion: reduce)')
    sync()
    query.addEventListener('change', sync)
  })
  onBeforeUnmount(() => query?.removeEventListener('change', sync))
  return reduced
}

/**
 * Runs `frame(dt, t)` on requestAnimationFrame only while `target` is on
 * screen and the tab is visible, so offscreen animations cost nothing.
 */
export function useVisibleAnimation(
  target: Ref<HTMLElement | null>,
  frame: (dtSeconds: number, tSeconds: number) => void,
  enabled: Ref<boolean> = ref(true),
) {
  let raf = 0
  let last = 0
  let onScreen = false
  let io: IntersectionObserver | null = null

  const loop = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0
    last = now
    frame(dt, now / 1000)
    raf = requestAnimationFrame(loop)
  }
  const start = () => {
    if (raf || !onScreen || document.hidden || !enabled.value) return
    last = 0
    raf = requestAnimationFrame(loop)
  }
  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
  }
  const onVisibility = () => (document.hidden ? stop() : start())

  onMounted(() => {
    if (!target.value) return
    io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false
      if (onScreen) start()
      else stop()
    })
    io.observe(target.value)
    document.addEventListener('visibilitychange', onVisibility)
  })
  onBeforeUnmount(() => {
    stop()
    io?.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
  })

  return {
    restart() {
      stop()
      start()
    },
    stop,
  }
}

/** Keeps a canvas' backing store matched to its CSS size × devicePixelRatio. */
export function useCanvasSize(canvas: Ref<HTMLCanvasElement | null>, onResize?: (w: number, h: number) => void) {
  const size = { w: 0, h: 0, dpr: 1 }
  let ro: ResizeObserver | null = null
  onMounted(() => {
    const el = canvas.value
    if (!el) return
    ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect()
      size.dpr = Math.min(devicePixelRatio || 1, 2)
      size.w = rect.width
      size.h = rect.height
      el.width = Math.round(rect.width * size.dpr)
      el.height = Math.round(rect.height * size.dpr)
      onResize?.(size.w, size.h)
    })
    ro.observe(el)
  })
  onBeforeUnmount(() => ro?.disconnect())
  return size
}

/** Reads a CSS custom property once (e.g. `--accent`). */
export const cssVar = (name: string, el: Element = document.documentElement) =>
  getComputedStyle(el).getPropertyValue(name).trim()
