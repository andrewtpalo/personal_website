import { execSync } from 'node:child_process'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * Production Content-Security-Policy. Everything the page needs is bundled
 * and served from the same origin, so the policy can stay strict: no
 * third-party hosts, no inline script, no inline <style>, no eval.
 *
 * Delivered as a <meta> tag so it travels with the static build regardless of
 * host. Directives that browsers ignore in <meta> (frame-ancestors,
 * report-to) belong in real response headers - see README.
 */
export const CSP: Record<string, string[]> = {
  'default-src': ["'none'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'manifest-src': ["'self'"],
  'base-uri': ["'none'"],
  'form-action': ["'none'"],
  'object-src': ["'none'"],
  'require-trusted-types-for': ["'script'"],
  'trusted-types': ['vue'],
  'upgrade-insecure-requests': [],
}

const serializeCsp = (policy: Record<string, string[]>) =>
  Object.entries(policy)
    .map(([directive, sources]) => [directive, ...sources].join(' '))
    .join('; ')

/** Injects the CSP only into production builds; Vite's dev server relies on inline styles + HMR. */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: serializeCsp(CSP) },
        injectTo: 'head-prepend',
      },
    ],
  }
}

function gitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig({
  plugins: [vue(), contentSecurityPolicy()],
  define: {
    __BUILD_COMMIT__: JSON.stringify(gitCommit()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    target: 'es2022',
    // Keep every asset as a file so nothing needs a data: exception beyond images.
    assetsInlineLimit: 0,
    sourcemap: false,
  },
})
