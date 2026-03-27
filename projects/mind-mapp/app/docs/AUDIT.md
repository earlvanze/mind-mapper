# Audit

## 2026-03-05
`npm audit` reports 2 moderate vulnerabilities in dev dependency chain (vite/esbuild). Fix requires Vite major upgrade.

- GHSA-67mh-4wv8-2f99 (esbuild dev server request exposure)
- Current: vite 5.x, esbuild <=0.24.2
- Fix: Vite 7.3.1 (major)

Decision: defer major upgrade until MVP stabilizes.
