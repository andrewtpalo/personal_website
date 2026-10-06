/**
 * Small app-wide UI state and actions shared by the terminal, the command
 * palette, and keyboard shortcuts.
 */
import { reactive, ref } from 'vue'
import { email, profile } from '../data/profile'

export const ACCENTS = ['green', 'red', 'blue', 'amber'] as const
export type Accent = (typeof ACCENTS)[number]
export const isAccent = (value: string): value is Accent => (ACCENTS as readonly string[]).includes(value)

export const accent = ref<Accent>('green')

export function setAccent(next: Accent) {
  accent.value = next
  if (next === 'green') delete document.documentElement.dataset.accent
  else document.documentElement.dataset.accent = next
  // Canvases cache resolved colors; tell them to re-read.
  window.dispatchEvent(new Event('accentchange'))
}

export const ui = reactive({
  paletteOpen: false,
  toasts: [] as { id: number; text: string }[],
})

let toastId = 0
export function toast(text: string, ms = 2600) {
  const id = toastId++
  ui.toasts.push({ id, text })
  setTimeout(() => (ui.toasts = ui.toasts.filter((t) => t.id !== id)), ms)
}

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export function goTo(section: string) {
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'
  if (section === 'top') window.scrollTo({ top: 0, behavior })
  else document.getElementById(section)?.scrollIntoView({ behavior })
}

export function downloadResume() {
  const a = document.createElement('a')
  a.href = profile.resume
  a.download = 'Andrew_Palo_Resume.pdf'
  a.click()
}

export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(email())
    toast(`copied ${email()}`)
  } catch {
    toast('clipboard unavailable; email is in the footer')
  }
}

export function focusTerminal() {
  const field = document.getElementById('terminal-input')
  field?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  field?.focus({ preventScroll: true })
}
