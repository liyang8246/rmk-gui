import { isTauri } from '@tauri-apps/api/core'

const ua = import.meta.client ? navigator.userAgent : ''

export const isMac = ua.includes('Mac')
export const isWindows = ua.includes('Windows')
export const isWeb = !isTauri()
