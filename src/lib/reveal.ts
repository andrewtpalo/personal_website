import type { Directive } from 'vue'

let observer: IntersectionObserver | null = null

function getObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer
  document.documentElement.classList.add('reveal-ready')
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-revealed')
        observer?.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  )
  return observer
}

/** v-reveal: fade/slide an element in the first time it scrolls into view. */
export const vReveal: Directive<HTMLElement> = {
  mounted(el) {
    el.dataset.reveal = ''
    getObserver()?.observe(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}
