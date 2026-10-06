import { describe, expect, it } from 'vitest'
import { commandNames, complete, execute, type Line, type ShellContext } from './shell'
import { skills } from '../data/profile'

const ctx: ShellContext = {
  history: ['whoami', 'help'],
  build: { commit: 'abc1234', time: '2026-01-01' },
  probes: {
    audit: async () => [[{ text: 'audit-ran' }]],
    fingerprint: async () => [[{ text: 'fp-ran' }]],
  },
  now: () => new Date('2026-01-01T00:00:00Z'),
}

const text = (lines: Line[]) => lines.map((l) => l.map((s) => s.text).join('')).join('\n')

describe('execute', () => {
  it('lists every visible command in help', async () => {
    const out = text((await execute('help', ctx)).lines)
    for (const name of commandNames) expect(out).toContain(name)
  })

  it('reports unknown commands', async () => {
    expect(text((await execute('frobnicate', ctx)).lines)).toContain('command not found: frobnicate')
  })

  it('is case-insensitive on the command name and supports aliases', async () => {
    const a = text((await execute('WHOAMI', ctx)).lines)
    expect(a).toContain('Andrew Palo')
    const b = text((await execute('exp', ctx)).lines)
    expect(b).toContain('Fiserv')
  })

  it('navigates with cd and rejects unknown directories', async () => {
    expect((await execute('cd platform/', ctx)).effect).toEqual({ type: 'navigate', section: 'platform' })
    expect((await execute('cd', ctx)).effect).toEqual({ type: 'navigate', section: 'top' })
    const bad = await execute('cd /root', ctx)
    expect(bad.effect).toBeUndefined()
    expect(text(bad.lines)).toContain('no such directory')
  })

  it('filters skills by group', async () => {
    const out = text((await execute('skills ai', ctx)).lines)
    expect(out).toContain('[AI]')
    expect(out).not.toContain('[Security]')
  })

  it('cat prints files, refuses directories and sensitive paths', async () => {
    const json = text((await execute('cat skills.json', ctx)).lines)
    expect(JSON.parse(json)).toEqual(Object.fromEntries(skills.map((g) => [g.id, g.items])))
    expect(text((await execute('cat platform', ctx)).lines)).toContain('Is a directory')
    expect(text((await execute('cat /etc/shadow', ctx)).lines)).toContain('Permission denied')
  })

  it('delegates browser probes to the context', async () => {
    expect(text((await execute('audit', ctx)).lines)).toBe('audit-ran')
    expect(text((await execute('fingerprint', ctx)).lines)).toBe('fp-ran')
  })

  it('returns side effects as data', async () => {
    expect((await execute('clear', ctx)).effect).toEqual({ type: 'clear' })
    expect((await execute('resume', ctx)).effect).toEqual({ type: 'download' })
  })

  it('switches theme only to known accents', async () => {
    expect((await execute('theme RED', ctx)).effect).toEqual({ type: 'theme', accent: 'red' })
    const bad = await execute('theme pink', ctx)
    expect(bad.effect).toBeUndefined()
    expect(text(bad.lines)).toContain('usage: theme')
  })

  it('renders neofetch with live session details', async () => {
    const withEnv: ShellContext = { ...ctx, env: () => ({ resolution: '1440×900 @2x', uptimeSeconds: 75, accent: 'blue' }) }
    const out = text((await execute('neofetch', withEnv)).lines)
    expect(out).toContain('Uptime: 1 min 15 s')
    expect(out).toContain('Resolution: 1440×900 @2x')
    expect(out).toContain('Kernel: build abc1234')
  })

  it('turns thrown errors into output instead of crashing', async () => {
    const failing: ShellContext = { ...ctx, probes: { ...ctx.probes, audit: async () => Promise.reject(new Error('boom')) } }
    expect(text((await execute('audit', failing)).lines)).toContain('audit: boom')
  })
})

describe('complete', () => {
  it('completes a unique command', () => {
    expect(complete('whoa')).toEqual({ value: 'whoami ', options: [] })
  })

  it('extends to the common prefix and lists ambiguous options', () => {
    const r = complete('e')
    expect(r.options).toEqual(expect.arrayContaining(['education', 'experience']))
    expect(r.value).toBe('e')
  })

  it('completes arguments', () => {
    expect(complete('cd pla').value).toBe('cd platform')
    expect(complete('skills sec').value).toBe('skills security')
    expect(complete('cat ab').value).toBe('cat about.txt')
    expect(complete('theme am').value).toBe('theme amber')
  })
})
