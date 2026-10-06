/**
 * Live, in-browser security self-audit of this page. Every check inspects the
 * running document; nothing is hard-coded to "pass".
 *
 * Passive checks only read state. Active checks deliberately attempt
 * something the CSP should forbid (eval, a raw innerHTML sink) and report
 * whether the browser blocked it; they produce expected CSP violation
 * messages in the console, so they only run on request.
 */

export type Status = 'pass' | 'warn' | 'fail' | 'info'

export interface Finding {
  id: string
  label: string
  status: Status
  detail: string
}

function readCsp(): Map<string, string[]> | null {
  const meta = document.querySelector<HTMLMetaElement>('meta[http-equiv="Content-Security-Policy"]')
  if (!meta) return null
  const directives = new Map<string, string[]>()
  for (const part of meta.content.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/)
    if (name) directives.set(name.toLowerCase(), sources)
  }
  return directives
}

export function passiveAudit(): Finding[] {
  const findings: Finding[] = []
  const csp = readCsp()

  if (!csp) {
    findings.push({
      id: 'csp',
      label: 'Content-Security-Policy',
      status: import.meta.env.DEV ? 'info' : 'fail',
      detail: import.meta.env.DEV ? 'not injected on the dev server (production builds only)' : 'no policy found',
    })
  } else {
    const scripts = csp.get('script-src') ?? csp.get('default-src') ?? []
    const unsafe = scripts.filter((s) => /unsafe-(inline|eval)|\*/.test(s))
    findings.push({
      id: 'csp',
      label: 'Content-Security-Policy',
      status: unsafe.length ? 'warn' : 'pass',
      detail: unsafe.length
        ? `script-src allows ${unsafe.join(' ')}`
        : `${csp.size} directives · default-src ${csp.get('default-src')?.join(' ') ?? '(unset)'} · script-src ${scripts.join(' ')}`,
    })
    const tt = csp.get('require-trusted-types-for')
    findings.push({
      id: 'trusted-types',
      label: 'Trusted Types',
      status: tt?.includes("'script'") ? 'pass' : 'warn',
      detail: tt ? "required for 'script' sinks, so DOM XSS sinks only accept vetted values" : 'not enforced',
    })
    findings.push({
      id: 'object-src',
      label: 'Plugins / object-src',
      status: csp.get('object-src')?.includes("'none'") ? 'pass' : 'warn',
      detail: `object-src ${csp.get('object-src')?.join(' ') ?? '(inherits default-src)'}`,
    })
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  const thirdParty = new Set(
    resources
      .map((r) => {
        try {
          return new URL(r.name).origin
        } catch {
          return location.origin
        }
      })
      .filter((origin) => origin !== location.origin && !origin.startsWith('chrome-extension') && !origin.startsWith('moz-extension')),
  )
  findings.push({
    id: 'third-party',
    label: 'Third-party requests',
    status: thirdParty.size === 0 ? 'pass' : 'warn',
    detail:
      thirdParty.size === 0
        ? `0 of ${resources.length} loaded resources left this origin: no CDNs, fonts, analytics, or trackers`
        : `requests to: ${[...thirdParty].join(', ')}`,
  })

  const cookieCount = document.cookie ? document.cookie.split(';').length : 0
  findings.push({
    id: 'cookies',
    label: 'Cookies',
    status: cookieCount === 0 ? 'pass' : 'warn',
    detail: cookieCount === 0 ? 'none set, so nothing to consent to' : `${cookieCount} readable cookie(s)`,
  })

  const referrer = document.querySelector<HTMLMetaElement>('meta[name="referrer"]')?.content
  findings.push({
    id: 'referrer',
    label: 'Referrer policy',
    status: referrer === 'no-referrer' ? 'pass' : 'info',
    detail: referrer ? `${referrer}: outbound links don't leak where you came from` : 'browser default',
  })

  findings.push({
    id: 'transport',
    label: 'Secure context',
    status: window.isSecureContext ? 'pass' : 'warn',
    detail: window.isSecureContext ? `${location.protocol.replace(':', '')} · Web Crypto available` : 'served over plain HTTP',
  })

  return findings
}

/** Attempts operations a strict CSP must block. Expect console CSP violation reports. */
export function activeAudit(): Finding[] {
  const findings: Finding[] = []

  let evalBlocked = false
  try {
    new Function('return 1')()
  } catch {
    evalBlocked = true
  }
  findings.push({
    id: 'eval',
    label: 'eval() / new Function',
    status: evalBlocked ? 'pass' : import.meta.env.DEV ? 'info' : 'fail',
    detail: evalBlocked ? 'attempted and blocked by the browser' : 'attempted and executed (no CSP in effect)',
  })

  let sinkBlocked = false
  try {
    const probe = document.createElement('div')
    probe.innerHTML = '<b>probe</b>'
  } catch {
    sinkBlocked = true
  }
  findings.push({
    id: 'innerHTML',
    label: 'Raw innerHTML sink',
    status: sinkBlocked ? 'pass' : import.meta.env.DEV ? 'info' : 'fail',
    detail: sinkBlocked
      ? 'attempted an untyped string assignment, rejected by Trusted Types'
      : 'attempted and accepted (Trusted Types not enforced in this browser/build)',
  })

  return findings
}
