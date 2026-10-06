/**
 * A tiny command interpreter for the in-page terminal.
 *
 * Pure TypeScript with no DOM access: anything browser-specific (security
 * probes, build metadata) is injected through ShellContext, and side effects
 * (scrolling, downloads, clearing the screen) are returned as data for the UI
 * to perform. That keeps every command unit-testable.
 */
import { builds, education, email, platform, profile, skills, timeline } from '../data/profile'
import { sections } from '../data/sections'
import { fnv1a } from './rng'
import { ACCENTS, isAccent, type Accent } from './ui'

export type Tone = 'dim' | 'accent' | 'info' | 'warn' | 'crit' | 'bold'

export interface Segment {
  text: string
  tone?: Tone
  /** Render as a link. */
  href?: string
  /** Render as a clickable command that runs when activated. */
  cmd?: string
}
export type Line = Segment[]

export type Effect =
  | { type: 'clear' }
  | { type: 'navigate'; section: string }
  | { type: 'download' }
  | { type: 'theme'; accent: Accent }

export interface CommandResult {
  lines: Line[]
  effect?: Effect
}

export interface ShellContext {
  history: readonly string[]
  build: { commit: string; time: string }
  probes: {
    audit(): Promise<Line[]>
    fingerprint(): Promise<Line[]>
  }
  now?: () => Date
  /** Live session details for `neofetch`. */
  env?: () => { resolution: string; uptimeSeconds: number; accent: string }
}

interface Command {
  name: string
  aliases?: string[]
  summary: string
  hidden?: boolean
  /** Candidates for the first argument, used by tab completion. */
  args?: () => string[]
  run(args: string[], ctx: ShellContext): CommandResult | Promise<CommandResult>
}

// ── output helpers ──────────────────────────────────────────────────────────

const seg = (text: string, tone?: Tone): Segment => ({ text, tone })
const line = (...parts: (string | Segment)[]): Line =>
  parts.map((p) => (typeof p === 'string' ? { text: p } : p))
const blank: Line = []
const out = (...lines: Line[]): CommandResult => ({ lines })
const cmdLink = (cmd: string, tone: Tone = 'accent'): Segment => ({ text: cmd, tone, cmd })

/** Short, stable pseudo-commit hash for a piece of content. */
export const shortHash = (text: string) => fnv1a(text).slice(0, 7)

// ── virtual filesystem ──────────────────────────────────────────────────────

const files: Record<string, (ctx: ShellContext) => CommandResult> = {
  'about.txt': () => out(line(profile.summary)),
  'experience.log': () => gitLog(),
  'skills.json': () =>
    out(
      ...JSON.stringify(Object.fromEntries(skills.map((g) => [g.id, g.items])), null, 2)
        .split('\n')
        .map((l) => line(seg(l, 'info'))),
    ),
  'contact.txt': () => contact(),
  'resume.pdf': () =>
    out(line(seg('cat: resume.pdf: binary file; run ', 'warn'), cmdLink('resume'), seg(' to download it', 'warn'))),
}
const hiddenFiles: Record<string, () => CommandResult> = {
  '.secrets': () =>
    out(line(seg('cat: .secrets: Permission denied', 'crit')), line(seg('encrypted at rest; the keys are not on this box.', 'dim'))),
}
const sensitivePaths = ['/etc/passwd', '/etc/shadow', '~/.ssh/id_rsa', '.ssh/id_rsa', '.env']

// ── command implementations ─────────────────────────────────────────────────

function gitLog(): CommandResult {
  const lines: Line[] = []
  for (const entry of timeline) {
    if (entry.kind === 'education') {
      lines.push(line(seg(`commit ${shortHash(education.school)}`, 'warn'), seg(' (tag: v2020.05)', 'info')))
      lines.push(line('    ', seg(`${education.degree}, ${education.school}`, 'bold')))
      lines.push(line('    ', seg(education.honors.join(' · '), 'dim')))
      lines.push(blank)
      continue
    }
    const { role } = entry
    const when = role.start === role.end ? role.start : `${role.start} – ${role.end}`
    lines.push(line(seg(`commit ${shortHash(role.org + role.title)}`, 'warn'), role.current ? seg(' (HEAD -> main)', 'info') : ''))
    lines.push(line(seg(`Date:   ${when}`, 'dim')))
    lines.push(line('    ', seg(`${role.title} @ ${role.org}`, 'bold'), role.orgNote ? seg(` (${role.orgNote})`, 'dim') : ''))
    if (!role.compact) for (const p of role.points) lines.push(line(seg('    • ', 'accent'), p))
    else lines.push(line('    ', seg(role.points.join(' '), 'dim')))
    lines.push(blank)
  }
  return out(...lines.slice(0, -1))
}

function contact(): CommandResult {
  const address = email()
  return out(
    line(seg('email   ', 'dim'), { text: address, tone: 'accent', href: `mailto:${address}` }),
    line(seg('github  ', 'dim'), { text: profile.github.replace('https://', ''), tone: 'accent', href: profile.github }),
    line(seg('web     ', 'dim'), seg(profile.domain)),
    line(seg('resume  ', 'dim'), cmdLink('resume')),
  )
}

// Pure ASCII so every glyph is guaranteed monospace: a padlock inside a shield.
const LOGO = [
  ' .--------------. ',
  ' |     .--.     | ',
  ' |    /    \\    | ',
  ' |   _|____|_   | ',
  ' |  |   ()   |  | ',
  ' |  |   ||   |  | ',
  '  \\ |________| /  ',
  "   '-.______.-'   ",
]

function formatUptime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return m ? `${m} min ${s} s` : `${s} s`
}

function neofetch(ctx: ShellContext): CommandResult {
  const env = ctx.env?.() ?? { resolution: 'unknown', uptimeSeconds: 0, accent: 'green' }
  const kv = (k: string, v: string): Segment[] => [seg(`${k}: `, 'accent'), seg(v)]
  const info: Segment[][] = [
    [seg(`visitor@${profile.domain}`, 'bold')],
    [seg('─'.repeat(22), 'dim')],
    kv('OS', 'PaloOS 2.0 (Vue 3 + Vite)'),
    kv('Host', profile.domain),
    kv('Kernel', `build ${ctx.build.commit}`),
    kv('Uptime', formatUptime(env.uptimeSeconds)),
    kv('Shell', `palosh (${commandNames.length} commands)`),
    kv('Resolution', env.resolution),
    kv('Theme', `${env.accent} on #06080b`),
    kv('Owner', profile.name),
  ]
  const swatches = (['accent', 'info', 'warn', 'crit', 'bold', 'dim'] as Tone[]).map((t) => seg('███', t))
  const rows = Math.max(LOGO.length, info.length + 2)
  const lines: Line[] = []
  for (let i = 0; i < rows; i++) {
    const logo = seg(LOGO[i] ?? ' '.repeat(LOGO[0]!.length), 'accent')
    const right = i < info.length ? info[i]! : i === info.length + 1 ? swatches : []
    lines.push([logo, seg('  '), ...right])
  }
  return out(...lines)
}

function skillsFor(filter?: string): CommandResult {
  const query = filter?.toLowerCase()
  const groups = query
    ? skills.filter((g) => g.id.startsWith(query) || g.label.toLowerCase().startsWith(query))
    : skills
  if (query && groups.length === 0) {
    return out(
      line(seg(`skills: unknown group '${filter}'. `, 'crit'), seg('groups: ', 'dim'), ...skills.flatMap((g) => [cmdLink(`skills ${g.id}`), seg(' ')])),
    )
  }
  const lines: Line[] = []
  for (const g of groups) {
    lines.push(line(seg(`[${g.label}]`, 'info')))
    g.items.forEach((item, i) => lines.push(line(seg(i === g.items.length - 1 ? ' └─ ' : ' ├─ ', 'dim'), item)))
  }
  return out(...lines)
}

const commands: Command[] = [
  {
    name: 'help',
    aliases: ['?', 'man'],
    summary: 'list available commands',
    run: () =>
      out(
        line(seg('available commands (click one or type it)', 'dim')),
        blank,
        ...commands
          .filter((c) => !c.hidden)
          .map((c) => line(cmdLink(c.name.padEnd(13)), seg(c.summary, 'dim'))),
        blank,
        line(seg('keys: ', 'dim'), 'Tab', seg(' complete · ', 'dim'), '↑/↓', seg(' history · ', 'dim'), 'Ctrl+L', seg(' clear · ', 'dim'), '/', seg(' focus terminal · ', 'dim'), 'Ctrl+K', seg(' command palette', 'dim')),
      ),
  },
  {
    name: 'whoami',
    summary: 'who you are talking to',
    run: () =>
      out(
        line(seg(profile.name, 'bold'), seg(', ', 'dim'), seg(profile.title, 'accent')),
        line(seg(profile.focus.join(' · '), 'dim')),
        line(seg(profile.location, 'dim')),
      ),
  },
  { name: 'about', summary: 'the short version', run: () => out(line(profile.summary)) },
  {
    name: 'experience',
    aliases: ['exp', 'work'],
    summary: 'work history, as a git log',
    run: () => gitLog(),
  },
  {
    name: 'platform',
    aliases: ['arch'],
    summary: 'architecture of the security analytics platform',
    run: () =>
      out(
        line(seg(platform.name, 'bold'), seg(` @ ${platform.org}`, 'dim')),
        blank,
        ...platform.sources.map((s) => line(seg('src  ', 'dim'), seg(`${s.group}: `, 'info'), s.items.join(', '))),
        ...platform.layers.map((l) => line(seg('core ', 'dim'), seg(`${l.label}: `, 'info'), l.tech.join(', '))),
        line(seg('out  ', 'dim'), seg('consumers: ', 'info'), `${platform.consumers.join(', ')} (200+ DAU)`),
        line(seg('ship ', 'dim'), seg('delivery: ', 'info'), platform.delivery.join(' → ')),
        blank,
        line(seg('→ ', 'dim'), cmdLink('cd platform'), seg(' for the diagram', 'dim')),
      ),
  },
  {
    name: 'risk',
    summary: 'how the platform scores and reduces cyber risk',
    run: () =>
      out(
        line(seg('risk(e) = likelihood(e) × impact(e)', 'accent')),
        line(seg('scored for every application, endpoint, person, and account; rolled up to an overall posture', 'dim')),
        blank,
        line('Turns thousands of findings into a ranked answer to "what do we fix next?", so remediation goes to the'),
        line('exposures that reduce the most cyber risk.'),
        blank,
        line(seg('→ ', 'dim'), cmdLink('cd platform'), seg(' to play with the risk matrix', 'dim')),
      ),
  },
  {
    name: 'builds',
    aliases: ['projects'],
    summary: 'independent things I have built',
    run: () =>
      out(
        ...builds.flatMap((b) => [
          line(seg(b.name, 'bold'), seg(` (${b.role})`, 'dim')),
          line(seg('  ', 'dim'), b.summary),
          line(seg('  ', 'dim'), seg(b.stack.join(' · '), 'info')),
        ]),
      ),
  },
  {
    name: 'skills',
    summary: 'skills, optionally by group: skills security',
    args: () => skills.map((g) => g.id),
    run: (args) => skillsFor(args[0]),
  },
  {
    name: 'education',
    aliases: ['edu'],
    summary: 'degree and honors',
    run: () =>
      out(
        line(seg(education.school, 'bold'), seg(` · ${education.date}`, 'dim')),
        line(`${education.degree}, ${education.minor}`),
        line(seg(education.honors.join(' · '), 'accent')),
        line(seg('research: ', 'dim'), cmdLink('research', 'info')),
      ),
  },
  {
    name: 'research',
    summary: 'echoic-flow UAV control + Kalman filtering',
    run: () => {
      const { research } = education
      const { award } = research
      return out(
        line(seg(research.title, 'bold')),
        line(seg(`advisors: ${research.advisors.join(', ')} · ${research.date}`, 'dim')),
        line(research.summary),
        blank,
        line(seg('median descent error over 1,000 simulated descents:', 'dim')),
        ...research.results.map((r) =>
          line(seg(`  ${r.method.padEnd(22)}`, r.method === 'Kalman filter' ? 'accent' : 'dim'), `${r.medianCm.toFixed(2)} cm`),
        ),
        blank,
        line(seg('thesis  ', 'dim'), { text: 'kb.osu.edu', tone: 'accent', href: research.thesisUrl }),
        line(seg('award   ', 'dim'), { text: `${award.place.toLowerCase()}, OSU undergraduate research forum (${award.date.slice(-4)})`, tone: 'dim', href: award.url }),
        line(seg('→ ', 'dim'), cmdLink('cd research'), seg(' to run a live Kalman filter', 'dim')),
      )
    },
  },
  { name: 'contact', summary: 'how to reach me', run: () => contact() },
  {
    name: 'resume',
    aliases: ['cv'],
    summary: 'download the PDF resume',
    run: () => ({ lines: [line(seg('fetching Andrew_Palo_Resume.pdf …', 'dim'))], effect: { type: 'download' } }),
  },
  {
    name: 'audit',
    summary: "live security self-audit of this page",
    run: async (_args, ctx) => out(...(await ctx.probes.audit())),
  },
  {
    name: 'fingerprint',
    summary: 'what your browser reveals without asking',
    run: async (_args, ctx) => out(...(await ctx.probes.fingerprint())),
  },
  {
    name: 'ls',
    summary: 'list files',
    args: () => ['-a'],
    run: (args) => {
      const showHidden = args.some((a) => a.startsWith('-') && a.includes('a'))
      return out(
        line(...sections.flatMap((s) => [{ text: `${s.id}/`, tone: 'info' as const, cmd: `cd ${s.id}` }, seg('  ')])),
        line(
          ...(showHidden ? Object.keys(hiddenFiles) : []).flatMap((f) => [seg(f, 'dim'), seg('  ')]),
          ...Object.keys(files).flatMap((f) => [{ text: f, tone: 'accent' as const, cmd: `cat ${f}` }, seg('  ')]),
        ),
      )
    },
  },
  {
    name: 'cd',
    summary: 'jump to a section: cd platform',
    args: () => sections.map((s) => s.id),
    run: (args) => {
      const target = (args[0] ?? '~').replace(/\/$/, '')
      if (target === '~' || target === '/' || target === '..') return { lines: [], effect: { type: 'navigate', section: 'top' } }
      const match = sections.find((s) => s.id === target)
      if (!match) return out(line(seg(`cd: no such directory: ${target}`, 'crit')))
      return { lines: [line(seg(`→ ~/${match.id}`, 'dim'))], effect: { type: 'navigate', section: match.id } }
    },
  },
  {
    name: 'cat',
    summary: 'print a file: cat about.txt',
    args: () => Object.keys(files),
    run: (args, ctx) => {
      const name = args[0]
      if (!name) return out(line(seg('usage: cat <file>', 'warn')))
      if (sensitivePaths.includes(name))
        return out(
          line(seg(`cat: ${name}: Permission denied`, 'crit')),
          line(seg("This incident has been logged. (It hasn't. This page collects nothing.)", 'dim')),
        )
      if (sections.some((s) => s.id === name.replace(/\/$/, ''))) return out(line(seg(`cat: ${name}: Is a directory`, 'crit')))
      const file = files[name] ?? hiddenFiles[name]
      if (!file) return out(line(seg(`cat: ${name}: No such file`, 'crit')))
      return file(ctx)
    },
  },
  {
    name: 'git',
    summary: 'git log',
    hidden: true,
    args: () => ['log'],
    run: (args) =>
      args[0] === 'log' ? gitLog() : out(line(seg(`git: '${args[0] ?? ''}' is not wired up here. try `, 'warn'), cmdLink('git log'))),
  },
  {
    name: 'history',
    summary: 'previously run commands',
    run: (_args, ctx) =>
      out(...ctx.history.map((h, i) => line(seg(String(i + 1).padStart(4) + '  ', 'dim'), h))),
  },
  {
    name: 'uname',
    summary: 'what this page runs on',
    run: (_args, ctx) =>
      out(line('PaloOS 2.0 · Vue 3 · Vite · TypeScript · ', seg(`build ${ctx.build.commit}`, 'info'), seg(` (${ctx.build.time})`, 'dim'))),
  },
  {
    name: 'neofetch',
    aliases: ['fetch'],
    summary: 'system info, the classic way',
    run: (_args, ctx) => neofetch(ctx),
  },
  {
    name: 'theme',
    summary: `switch accent color: ${ACCENTS.join(' | ')}`,
    args: () => [...ACCENTS],
    run: (args) => {
      const next = args[0]?.toLowerCase()
      if (!next || !isAccent(next)) {
        return out(line(seg('usage: theme ', 'warn'), ...ACCENTS.flatMap((a) => [cmdLink(a, 'info'), seg(' ')])))
      }
      return { lines: [line(seg(`accent → ${next}`, 'dim'))], effect: { type: 'theme', accent: next } }
    },
  },
  {
    name: 'konami',
    summary: 'cheat codes',
    hidden: true,
    run: () => out(line(seg('↑ ↑ ↓ ↓ ← → ← → B A', 'warn'), seg('  (outside the terminal)', 'dim'))),
  },
  { name: 'clear', summary: 'clear the screen', run: () => ({ lines: [], effect: { type: 'clear' } }) },
  { name: 'echo', summary: 'print arguments', hidden: true, run: (args) => out(line(args.join(' '))) },
  {
    name: 'date',
    summary: 'current date',
    hidden: true,
    run: (_args, ctx) => out(line((ctx.now?.() ?? new Date()).toString())),
  },
  {
    name: 'sudo',
    summary: 'nope',
    hidden: true,
    run: () => out(line(seg('visitor is not in the sudoers file. This incident will be reported.', 'crit'))),
  },
  {
    name: 'rm',
    summary: 'nope',
    hidden: true,
    run: () => out(line(seg('rm: read-only file system. This is a static site; there is nothing to delete.', 'crit'))),
  },
  {
    name: 'nmap',
    summary: 'nope',
    hidden: true,
    run: () => out(line(seg('scanning visitors is rude. ', 'warn'), seg('scan this page instead: ', 'dim'), cmdLink('audit'))),
  },
  {
    name: 'hire',
    summary: 'excellent idea',
    hidden: true,
    run: () => {
      const result = contact()
      return out(line(seg('excellent idea.', 'accent')), blank, ...result.lines)
    },
  },
  {
    name: 'exit',
    aliases: ['logout'],
    summary: 'nope',
    hidden: true,
    run: () => out(line(seg('there is no escape from a single-page app. try ', 'dim'), cmdLink('clear'))),
  },
]

const lookup = new Map<string, Command>()
for (const c of commands) for (const n of [c.name, ...(c.aliases ?? [])]) lookup.set(n, c)

export const commandNames = commands.filter((c) => !c.hidden).map((c) => c.name)

export function tokenize(input: string): string[] {
  return input.trim().split(/\s+/).filter(Boolean)
}

export async function execute(input: string, ctx: ShellContext): Promise<CommandResult> {
  const [name, ...args] = tokenize(input)
  if (!name) return out()
  const command = lookup.get(name.toLowerCase())
  if (!command) {
    return out(line(seg(`command not found: ${name}`, 'crit'), seg('. try ', 'dim'), cmdLink('help')))
  }
  try {
    return await command.run(args, ctx)
  } catch (err) {
    return out(line(seg(`${command.name}: ${err instanceof Error ? err.message : String(err)}`, 'crit')))
  }
}

function commonPrefix(words: string[]): string {
  if (words.length === 0) return ''
  let prefix = words[0]!
  for (const w of words) while (!w.startsWith(prefix)) prefix = prefix.slice(0, -1)
  return prefix
}

/** Tab completion. Returns the new input value plus the candidates when ambiguous. */
export function complete(input: string): { value: string; options: string[] } {
  const endsWithSpace = /\s$/.test(input)
  const tokens = tokenize(input)

  if (tokens.length <= 1 && !endsWithSpace) {
    const partial = tokens[0] ?? ''
    const names = [...lookup.keys()].filter((n) => n.startsWith(partial) && /^[a-z]/.test(n))
    const visible = names.filter((n) => commandNames.includes(n))
    const options = (visible.length ? visible : names).sort()
    if (options.length === 1) return { value: `${options[0]} `, options: [] }
    return { value: commonPrefix(options) || partial, options }
  }

  const command = lookup.get(tokens[0]!.toLowerCase())
  const candidates = command?.args?.() ?? []
  const partial = endsWithSpace ? '' : (tokens[tokens.length - 1] ?? '')
  const head = (endsWithSpace ? tokens : tokens.slice(0, -1)).join(' ')
  const options = candidates.filter((c) => c.startsWith(partial)).sort()
  if (options.length === 1) return { value: `${head} ${options[0]}`, options: [] }
  return { value: `${head} ${commonPrefix(options) || partial}`, options }
}
