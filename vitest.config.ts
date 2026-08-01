import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// qemu/ is excluded: those tests need a riscv toolchain and qemu-system-riscv32.
// Run them with `pnpm test:qemu`.
export default mergeConfig(viteConfig, defineConfig({
  test: { include: ['src/**/*.test.ts'] },
}))
