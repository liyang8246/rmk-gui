import type { ConnectedDevice, DeviceCapabilities, KeyAction, RynkClient, StorageResetMode, TopicEvent } from '../../rynk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const connectClient = vi.hoisted(() => vi.fn())
vi.mock('../../rynk', () => ({ connectClient }))

const { keyboardStore } = await import('./keyboard.svelte')

const CAPS: DeviceCapabilities = {
  num_layers: 1,
  num_rows: 1,
  num_cols: 2,
  num_encoders: 0,
  max_combos: 0,
  max_combo_keys: 4,
  macro_space_size: 0,
  max_morse: 0,
  max_patterns_per_key: 4,
  max_forks: 0,
  storage_enabled: true,
  lighting_enabled: false,
  is_split: false,
  num_split_peripherals: 0,
  ble_enabled: false,
  num_ble_profiles: 0,
  max_payload_size: 64,
  max_bulk_keys: 16,
  max_bulk_items: 4,
  macro_chunk_size: 28,
  bulk_transfer_supported: true,
}

const BLE_CAPS: DeviceCapabilities = { ...CAPS, ble_enabled: true, num_ble_profiles: 3 }

function rejection(name: string, message: string): Error {
  const e = new Error(message)
  e.name = name
  return e
}

/// Stands in for the wasm RynkClient. Only the methods the store actually
/// reaches are implemented; the cast keeps the other ~40 off the fake.
class FakeClient {
  caps: DeviceCapabilities = CAPS
  /// Deliberately unlike the transport label, so tests show which one the
  /// connection state picks up.
  productName = 'Fake60'
  keymap: KeyAction[] = ['No', 'No']
  locked = false
  freed = false
  /// Every client call in order — proves the store serializes the chain.
  calls: string[] = []
  /// Queued failure for the next set_key, so tests can force a rollback.
  failSetKey: Error | null = null
  matrixReads = 0
  bleProfile = 0
  /// Queued failure for the next session-ending command (reboot et al).
  failEndSession: Error | null = null
  private killTopic: ((e: Error) => void) | null = null

  private log<T>(name: string, value: T): Promise<T> {
    this.calls.push(name)
    return Promise.resolve(value)
  }

  get_version() { return this.log('get_version', { major: 1, minor: 0 }) }
  get_device_info() {
    return this.log('get_device_info', {
      rmk_version: { major: 0, minor: 1, patch: 0 },
      vendor_id: 1,
      product_id: 2,
      manufacturer: 'test',
      product_name: this.productName,
      serial_number: 'x',
    })
  }

  get_capabilities() { return this.log('get_capabilities', this.caps) }
  get_layout() { return this.log('get_layout', { default_variant: 0, variants: [] }) }
  get_behavior() { return this.log('get_behavior', {}) }
  get_default_layer() { return this.log('get_default_layer', 0) }
  read_all_keymap() { return this.log('read_all_keymap', [...this.keymap]) }
  read_all_combos() { return this.log('read_all_combos', []) }
  read_all_morses() { return this.log('read_all_morses', []) }
  get_lock_status() {
    return this.log('get_lock_status', {
      locked: this.locked,
      unlocking: false,
      remaining_keys: 0,
      key_positions: [],
    })
  }

  get_battery_status() { return this.log('get_battery_status', 'Unavailable') }
  get_ble_status() { return this.log('get_ble_status', { profile: this.bleProfile, state: 'Inactive' }) }
  get_connection_status() {
    return this.log('get_connection_status', {
      usb: 'Configured',
      ble: { profile: 0, state: 'Inactive' },
    })
  }

  get_connection_type() { return this.log('get_connection_type', 'Usb') }
  get_current_layer() { return this.log('get_current_layer', 0) }
  get_led_indicator() {
    return this.log('get_led_indicator', {
      num_lock: false,
      caps_lock: false,
      scroll_lock: false,
      compose: false,
      kana: false,
    })
  }

  get_matrix_state() {
    this.matrixReads++
    // Mirrors the firmware: GetMatrixState is an unlock-gated command.
    if (this.locked) return Promise.reject(rejection('Rejected', 'device rejected Locked'))
    return this.log('get_matrix_state', { pressed_bitmap: [0] })
  }

  get_sleep_state() { return this.log('get_sleep_state', false) }
  get_wpm() { return this.log('get_wpm', 0) }

  async set_key(layer: number, row: number, col: number, action: KeyAction) {
    this.calls.push(`set_key:${layer},${row},${col}`)
    // Yield so a second queued call would interleave here if unserialized.
    await Promise.resolve()
    const fail = this.failSetKey
    this.failSetKey = null
    if (fail) throw fail
    this.keymap[row * CAPS.num_cols + col] = action
  }

  async lock() {
    this.calls.push('lock')
    this.locked = true
  }

  /// The real ceremony needs the user holding keys; unlock on the first poll.
  async unlock_poll() {
    this.calls.push('unlock_poll')
    this.locked = false
    return { locked: false, unlocking: false, remaining_keys: 0, key_positions: [] }
  }

  async switch_ble_profile(slot: number) {
    this.calls.push(`switch_ble_profile:${slot}`)
    this.bleProfile = slot
  }

  async clear_ble_profile(slot: number) {
    this.calls.push(`clear_ble_profile:${slot}`)
    if (this.bleProfile === slot) this.bleProfile = 0
  }

  async storage_reset(mode: StorageResetMode) {
    this.calls.push(`storage_reset:${mode}`)
    if (mode === 'LayoutOnly') throw rejection('Rejected', 'device rejected Unimplemented')
    this.keymap = ['No', 'No']
  }

  reboot() { return this.endSession('reboot') }
  bootloader_jump() { return this.endSession('bootloader_jump') }

  /// The real device resets before it can ack, so tests queue the failure that
  /// stands in for that — the store must still drop the session.
  private async endSession(name: string) {
    this.calls.push(name)
    const fail = this.failEndSession
    this.failEndSession = null
    if (fail) throw fail
  }

  next_topic(): Promise<TopicEvent> {
    return new Promise((_resolve, reject) => {
      this.killTopic = reject
    })
  }

  /// Mirrors real link death: a parked next_topic() rejects on EOF.
  die() { this.killTopic?.(rejection('Disconnected', 'link closed')) }
  free() { this.freed = true }
}

function connect(client: FakeClient): ConnectedDevice {
  const link = {
    label: 'fake',
    send: async () => {},
    recv: async () => new Uint8Array(0),
    close: async () => { client.die() },
  }
  connectClient.mockResolvedValue({ client: client as unknown as RynkClient, major: 1, minor: 0 })
  return { link, label: 'fake' } as unknown as ConnectedDevice
}

async function connected(client = new FakeClient()): Promise<FakeClient> {
  const result = await keyboardStore.initStore(connect(client))
  expect(result.isOk()).toBe(true)
  return client
}

beforeEach(async () => {
  await keyboardStore.resetStore()
  connectClient.mockReset()
})

describe('connect', () => {
  it('populates device, config and status', async () => {
    const client = await connected()
    expect(keyboardStore.connection).toMatchObject({ phase: 'connected' })
    expect(keyboardStore.device?.capabilities.num_cols).toBe(2)
    expect(keyboardStore.config?.keymap).toEqual([[['No', 'No']]])
    expect(keyboardStore.status?.matrixState).toEqual({ pressed_bitmap: [0] })
    expect(client.freed).toBe(false)
  })

  it('labels the session with the reported product name', async () => {
    // A transport label can be a bare-id fallback when the descriptor carried
    // no product string, so the name the device reports is what the UI shows.
    await connected()
    expect(keyboardStore.connection).toEqual({ phase: 'connected', label: 'Fake60' })
  })

  it('falls back to the transport label when the device reports no name', async () => {
    const client = new FakeClient()
    client.productName = '   '
    await connected(client)
    expect(keyboardStore.connection).toEqual({ phase: 'connected', label: 'fake' })
  })

  it('keeps the transport label while connecting and on a failed handshake', async () => {
    // There is no device info before the handshake lands. connect() arms the
    // resolved mock, so the rejection has to be installed after it.
    const device = connect(new FakeClient())
    connectClient.mockRejectedValue(rejection('Rejected', 'device rejected Busy'))
    expect((await keyboardStore.initStore(device)).isErr()).toBe(true)
    expect(keyboardStore.connection).toMatchObject({ phase: 'error', label: 'fake' })
  })

  it('connects a locked device without reading the gated matrix state', async () => {
    const client = new FakeClient()
    client.locked = true
    await connected(client)
    expect(keyboardStore.connection?.phase).toBe('connected')
    expect(keyboardStore.status?.lockStatus.locked).toBe(true)
    expect(keyboardStore.status?.matrixState).toBeNull()
    expect(client.matrixReads).toBe(0)
  })

  it('reports a failed handshake as an error phase', async () => {
    connectClient.mockRejectedValue(rejection('Rejected', 'device rejected Busy'))
    const result = await keyboardStore.initStore(
      { link: { label: 'x', send: async () => {}, recv: async () => new Uint8Array(0), close: async () => {} } } as unknown as ConnectedDevice,
    )
    expect(result.isErr()).toBe(true)
    expect(keyboardStore.connection).toMatchObject({
      phase: 'error',
      cause: { type: 'rynk', code: 'Busy' },
    })
    expect(keyboardStore.config).toBeNull()
  })
})

describe('mutations', () => {
  it('applies optimistically and keeps the value on success', async () => {
    await connected()
    const result = await keyboardStore.setKey(0, 0, 1, 'Transparent')
    expect(result.isOk()).toBe(true)
    expect(keyboardStore.config?.keymap[0]![0]![1]).toBe('Transparent')
  })

  it('rolls back and surfaces the rynk code on rejection', async () => {
    const client = await connected()
    client.failSetKey = rejection('Rejected', 'device rejected Locked')
    const result = await keyboardStore.setKey(0, 0, 1, 'Transparent')
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'rynk', code: 'Locked' })
    expect(keyboardStore.config?.keymap[0]![0]![1]).toBe('No')
  })

  it('rejects out-of-range coordinates without touching the device', async () => {
    const client = await connected()
    const before = client.calls.length
    const result = await keyboardStore.setKey(0, 0, 9, 'Transparent')
    expect(result._unsafeUnwrapErr().type).toBe('invalid')
    expect(client.calls).toHaveLength(before)
  })

  it('serializes concurrent writes instead of interleaving them', async () => {
    const client = await connected()
    client.calls.length = 0
    await Promise.all([
      keyboardStore.setKey(0, 0, 0, 'Transparent'),
      keyboardStore.setKey(0, 0, 1, 'Transparent'),
    ])
    expect(client.calls).toEqual(['set_key:0,0,0', 'set_key:0,0,1'])
  })

  it('validates keymap shape before writing', async () => {
    await connected()
    const result = await keyboardStore.setKeymap([[['No']]])
    expect(result._unsafeUnwrapErr().type).toBe('invalid')
  })
})

describe('lock gate', () => {
  it('drops the cached matrix state when locking', async () => {
    await connected()
    expect(keyboardStore.status?.matrixState).not.toBeNull()
    const result = await keyboardStore.lock()
    expect(result.isOk()).toBe(true)
    expect(keyboardStore.status?.lockStatus.locked).toBe(true)
    expect(keyboardStore.status?.matrixState).toBeNull()
  })

  it('reads the gated matrix state back once unlocked', async () => {
    const client = new FakeClient()
    client.locked = true
    await connected(client)
    expect(keyboardStore.status?.matrixState).toBeNull()

    const result = await keyboardStore.unlockPoll()
    expect(result._unsafeUnwrap().locked).toBe(false)
    expect(keyboardStore.status?.matrixState).toEqual({ pressed_bitmap: [0] })
  })
})

describe('link death', () => {
  it('tears the session down when a request hits a dead link', async () => {
    const client = await connected()
    client.failSetKey = rejection('Disconnected', 'link closed')
    const result = await keyboardStore.setKey(0, 0, 1, 'Transparent')
    expect(result._unsafeUnwrapErr().type).toBe('transport')
    // The teardown is kicked off from the chain; let it settle.
    await vi.waitFor(() => expect(keyboardStore.connection?.phase).toBe('error'))
    expect(keyboardStore.config).toBeNull()
    expect(keyboardStore.device).toBeNull()
    expect(client.freed).toBe(true)
  })

  it('tears the session down when the topic loop sees EOF', async () => {
    const client = await connected()
    client.die()
    await vi.waitFor(() => expect(keyboardStore.connection?.phase).toBe('error'))
    expect(keyboardStore.connection?.cause?.type).toBe('transport')
    expect(keyboardStore.status).toBeNull()
    expect(client.freed).toBe(true)
  })

  it('rejects writes issued after the link died', async () => {
    const client = await connected()
    client.die()
    await vi.waitFor(() => expect(keyboardStore.connection?.phase).toBe('error'))
    const result = await keyboardStore.setKey(0, 0, 1, 'Transparent')
    expect(result._unsafeUnwrapErr().type).toBe('invalid')
  })
})

describe('ble', () => {
  async function bleConnected(): Promise<FakeClient> {
    const client = new FakeClient()
    client.caps = BLE_CAPS
    return await connected(client)
  }

  it('caches the refreshed status', async () => {
    const client = await bleConnected()
    client.bleProfile = 2
    const result = await keyboardStore.refreshBleStatus()
    expect(result._unsafeUnwrap()).toEqual({ profile: 2, state: 'Inactive' })
    expect(keyboardStore.status?.bleStatus).toEqual({ profile: 2, state: 'Inactive' })
  })

  it('switches a profile and reads the new status back', async () => {
    const client = await bleConnected()
    client.calls.length = 0
    const result = await keyboardStore.switchBleProfile(1)
    expect(result.isOk()).toBe(true)
    expect(client.calls).toEqual(['switch_ble_profile:1', 'get_ble_status'])
    expect(keyboardStore.status?.bleStatus?.profile).toBe(1)
  })

  it('clears a profile and reads the new status back', async () => {
    const client = await bleConnected()
    client.bleProfile = 1
    client.calls.length = 0
    const result = await keyboardStore.clearBleProfile(1)
    expect(result.isOk()).toBe(true)
    expect(client.calls).toEqual(['clear_ble_profile:1', 'get_ble_status'])
    expect(keyboardStore.status?.bleStatus?.profile).toBe(0)
  })

  it('rejects an out-of-range slot without touching the device', async () => {
    const client = await bleConnected()
    const before = client.calls.length
    expect((await keyboardStore.switchBleProfile(3))._unsafeUnwrapErr().type).toBe('invalid')
    expect(client.calls).toHaveLength(before)
  })

  it('rejects profile commands on a device without BLE', async () => {
    // The default fixture reports ble_enabled: false.
    await connected()
    const result = await keyboardStore.switchBleProfile(0)
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'invalid', cause: 'device has no BLE' })
  })
})

describe('storage reset', () => {
  it('refetches the wiped config in the same chain slot', async () => {
    const client = await connected()
    await keyboardStore.setKey(0, 0, 1, 'Transparent')
    expect(keyboardStore.config?.keymap[0]![0]![1]).toBe('Transparent')

    const result = await keyboardStore.storageReset('Full')
    expect(result.isOk()).toBe(true)
    expect(client.calls).toContain('storage_reset:Full')
    expect(keyboardStore.config?.keymap[0]![0]![1]).toBe('No')
  })

  it('surfaces Unimplemented and leaves the session alone', async () => {
    const client = await connected()
    const result = await keyboardStore.storageReset('LayoutOnly')
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'rynk', code: 'Unimplemented' })
    expect(keyboardStore.connection?.phase).toBe('connected')
    expect(client.freed).toBe(false)
  })
})

describe('session-ending commands', () => {
  for (const [name, call] of [
    ['reboot', () => keyboardStore.reboot()],
    ['bootloader_jump', () => keyboardStore.bootloaderJump()],
  ] as const) {
    it(`${name} tears the session down before it settles`, async () => {
      const client = await connected()
      const result = await call()
      expect(result.isOk()).toBe(true)
      expect(client.calls).toContain(name)
      // Awaited, not fire-and-forget: no waitFor here on purpose.
      expect(keyboardStore.connection).toEqual({ phase: 'disconnected', label: 'Fake60' })
      expect(keyboardStore.device).toBeNull()
      expect(keyboardStore.config).toBeNull()
      expect(client.freed).toBe(true)
    })

    it(`${name} still tears down when the ack never lands`, async () => {
      const client = await connected()
      // The device resets mid-command: the reply is a rejection, not a dead link.
      client.failEndSession = rejection('Rejected', 'device rejected NotReady')
      const result = await call()
      expect(result._unsafeUnwrapErr()).toEqual({ type: 'rynk', code: 'NotReady' })
      expect(keyboardStore.connection).toEqual({ phase: 'disconnected', label: 'Fake60' })
      expect(client.freed).toBe(true)
    })
  }

  it('reports disconnected, not link lost, when the device drops the link first', async () => {
    const client = await connected()
    client.failEndSession = rejection('Disconnected', 'link closed')
    const result = await keyboardStore.reboot()
    expect(result._unsafeUnwrapErr().type).toBe('transport')
    // The death path fires too; the user-initiated teardown is the one that sticks.
    expect(keyboardStore.connection).toEqual({ phase: 'disconnected', label: 'Fake60' })
    expect(client.freed).toBe(true)
  })

  it('rejects a reboot after the link died without relabelling the phase', async () => {
    const client = await connected()
    client.die()
    await vi.waitFor(() => expect(keyboardStore.connection?.phase).toBe('error'))
    expect((await keyboardStore.reboot())._unsafeUnwrapErr().type).toBe('invalid')
    // The command never reached the device, so 'link lost' must survive.
    expect(keyboardStore.connection?.phase).toBe('error')
  })
})

describe('disconnect', () => {
  it('keeps the label and frees the client', async () => {
    const client = await connected()
    await keyboardStore.disconnect()
    expect(keyboardStore.connection).toEqual({ phase: 'disconnected', label: 'Fake60' })
    expect(keyboardStore.config).toBeNull()
    expect(client.freed).toBe(true)
  })

  it('resetStore leaves no connection state', async () => {
    await connected()
    await keyboardStore.resetStore()
    expect(keyboardStore.connection).toBeNull()
  })
})
