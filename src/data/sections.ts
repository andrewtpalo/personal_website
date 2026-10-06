export interface Section {
  id: string
  label: string
}

/** Page sections in render order. Also the "directories" the terminal can `cd` into. */
export const sections: Section[] = [
  { id: 'experience', label: 'experience' },
  { id: 'platform', label: 'platform' },
  { id: 'builds', label: 'builds' },
  { id: 'research', label: 'research' },
  { id: 'skills', label: 'skills' },
  { id: 'privacy', label: 'privacy' },
]
