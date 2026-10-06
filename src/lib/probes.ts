/** Adapts the browser probes into terminal output for the shell. */
import { activeAudit, passiveAudit, type Status } from './audit'
import { collectFingerprint } from './fingerprint'
import type { Line, ShellContext, Tone } from './shell'

const statusTone: Record<Status, Tone> = { pass: 'accent', warn: 'warn', fail: 'crit', info: 'info' }

export const browserProbes: ShellContext['probes'] = {
  async audit() {
    const findings = [...passiveAudit(), ...activeAudit()]
    const passed = findings.filter((f) => f.status === 'pass').length
    const lines: Line[] = [[{ text: `self-audit: ${location.host}`, tone: 'dim' }], []]
    for (const f of findings) {
      lines.push([
        { text: `[${f.status.toUpperCase().padEnd(4)}] `, tone: statusTone[f.status] },
        { text: f.label.padEnd(24), tone: 'bold' },
        { text: f.detail, tone: 'dim' },
      ])
    }
    lines.push([], [{ text: `${passed}/${findings.length} checks passed`, tone: passed === findings.length ? 'accent' : 'warn' }])
    return lines
  },

  async fingerprint() {
    const fp = await collectFingerprint()
    return [
      [{ text: 'signals your browser shared with this page, unprompted:', tone: 'dim' }],
      [],
      ...fp.signals.map<Line>((s) => [{ text: s.key.padEnd(15), tone: 'info' }, { text: s.value }]),
      [],
      [{ text: `${fp.algorithm}  `, tone: 'dim' }, { text: fp.hash, tone: 'warn' }],
      [{ text: 'computed locally · never stored · never transmitted', tone: 'dim' }],
    ]
  },
}
