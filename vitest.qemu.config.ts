import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    include: ['qemu/**/*.test.ts'],
    // A cold cargo build pulls rmk from git and compiles a riscv firmware.
    hookTimeout: 900_000,
    testTimeout: 60_000,
    // One qemu instance, one TCP port.
    fileParallelism: false,
  },
}))
