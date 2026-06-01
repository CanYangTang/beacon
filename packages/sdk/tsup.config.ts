import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'AnalyticsSDK',
  dts: true,
  clean: true,
  sourcemap: true,
})
