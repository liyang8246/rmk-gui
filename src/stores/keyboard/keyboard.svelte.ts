import type { Result } from 'neverthrow'
import type {
  BehaviorConfig,
  BleStatus,
  Combo,
  ConnectedDevice,
  DeviceCapabilities,
  EncoderAction,
  Fork,
  KeyAction,
  LockStatus,
  MacroData,
  MatrixState,
  Morse,
  PeripheralStatus,
  RynkClient,
  StorageResetMode,
} from '../../rynk'
import type { KeyboardError } from './errors'
import type { ConnectionState, KeyboardConfig, KeyboardDevice, KeyboardStatus } from './types'
import { err, errAsync, ResultAsync } from 'neverthrow'
import { match, P } from 'ts-pattern'
import { connectClient } from '../../rynk'
import { toKeyboardError } from './errors'

const session = {
  client: null as RynkClient | null,
  connected: null as ConnectedDevice | null,
  chain: Promise.resolve() as Promise<void>,
  topicsReady: false,
  // Held so teardown can await the parked next_topic() before freeing the client.
  topicLoop: null as Promise<void> | null,
  // Set at init so enqueue() can report a dead link without reaching into the store.
  onDeath: null as ((cause: KeyboardError) => void) | null,
}

function notConnected<T>(): ResultAsync<T, KeyboardError> {
  return errAsync<T, KeyboardError>({ type: 'invalid', cause: 'not connected' })
}

function enqueue<T>(
  fn: () => ResultAsync<T, KeyboardError>,
): ResultAsync<T, KeyboardError> {
  const result: Promise<Result<T, KeyboardError>> = session.chain
    .then(() => fn())
    .then(
      (r: Result<T, KeyboardError>) => r,
      (e: unknown) => err<T, KeyboardError>(toKeyboardError(e)),
    )
    .then((r: Result<T, KeyboardError>) => {
      // A dead link never recovers, so drop the session rather than leave a
      // connected-looking store the user can keep editing.
      if (r.isErr() && r.error.type === 'transport') session.onDeath?.(r.error)
      return r
    })
  session.chain = result.then(
    () => {},
    () => {},
  )
  return new ResultAsync(result)
}

/// Commands and reads that need no optimistic update or rollback.
function runCommand<T>(call: (c: RynkClient) => Promise<T>): ResultAsync<T, KeyboardError> {
  return enqueue(() => {
    const client = session.client
    // Checked inside the chain, not at enqueue time: the link can die while queued.
    if (!client) return notConnected<T>()
    return ResultAsync.fromThrowable(() => call(client), toKeyboardError)()
  })
}

interface Mutation<T> {
  push: () => T
  call: (c: RynkClient) => Promise<void>
  undo: (snapshot: T) => void
}

function runMutation<T>(m: Mutation<T>): ResultAsync<void, KeyboardError> {
  return enqueue(() => {
    const client = session.client
    if (!client) return notConnected<void>()
    const snapshot = m.push()
    return ResultAsync.fromThrowable(() => m.call(client), toKeyboardError)()
      .orTee(() => m.undo(snapshot))
  })
}

async function fetchKeymap(client: RynkClient, caps: DeviceCapabilities): Promise<KeyAction[][][]> {
  const keymap: KeyAction[][][] = []
  // read_all_keymap pages the whole thing; a single get_keymap_bulk caps at
  // max_bulk_keys and silently drops the tail of a larger layer.
  const flat = await client.read_all_keymap()
  const expected = caps.num_layers * caps.num_rows * caps.num_cols
  if (flat.length !== expected)
    throw new Error(`keymap: got ${flat.length} actions, expected ${expected}`)
  for (let layer = 0; layer < caps.num_layers; layer++) {
    const rows: KeyAction[][] = []
    for (let r = 0; r < caps.num_rows; r++) {
      const start = (layer * caps.num_rows + r) * caps.num_cols
      rows.push(flat.slice(start, start + caps.num_cols))
    }
    keymap.push(rows)
  }
  return keymap
}

async function fetchEncoders(client: RynkClient, caps: DeviceCapabilities): Promise<EncoderAction[][]> {
  const encoders: EncoderAction[][] = []
  for (let e = 0; e < caps.num_encoders; e++) {
    const layers: EncoderAction[] = []
    for (let l = 0; l < caps.num_layers; l++) {
      layers.push(await client.get_encoder(e, l))
    }
    encoders.push(layers)
  }
  return encoders
}

async function fetchForks(client: RynkClient, caps: DeviceCapabilities): Promise<Fork[]> {
  const forks: Fork[] = []
  for (let i = 0; i < caps.max_forks; i++) {
    forks.push(await client.get_fork(i))
  }
  return forks
}

async function fetchMacros(client: RynkClient, caps: DeviceCapabilities): Promise<number[]> {
  // No upstream pager for macros: each chunk is exactly macro_chunk_size bytes,
  // zero-filled past the end, so walk the whole space by chunk.
  const out: number[] = []
  while (out.length < caps.macro_space_size) {
    const { data } = await client.get_macro(out.length)
    if (!data.length) break
    out.push(...data)
  }
  return out.slice(0, caps.macro_space_size)
}

async function fetchConfig(client: RynkClient, caps: DeviceCapabilities): Promise<KeyboardConfig> {
  const behavior = await client.get_behavior()
  const defaultLayer = await client.get_default_layer()
  const keymap = await fetchKeymap(client, caps)
  const encoders = await fetchEncoders(client, caps)
  const combos = await client.read_all_combos()
  const morses = await client.read_all_morses()
  const forks = await fetchForks(client, caps)
  const macros = await fetchMacros(client, caps)
  return { behavior, combos, defaultLayer, encoders, forks, keymap, macros, morses }
}

async function fetchStatus(client: RynkClient, caps: DeviceCapabilities): Promise<KeyboardStatus> {
  const lockStatus = await client.get_lock_status()
  const batteryStatus = caps.ble_enabled ? await client.get_battery_status() : 'Unavailable'
  const bleStatus = caps.ble_enabled ? await client.get_ble_status() : null
  const connectionStatus = await client.get_connection_status()
  const connectionType = await client.get_connection_type()
  const currentLayer = await client.get_current_layer()
  const ledIndicator = await client.get_led_indicator()
  // GetMatrixState is unlock-gated upstream; asking while locked fails connect.
  const matrixState = lockStatus.locked ? null : await client.get_matrix_state()
  const sleepState = await client.get_sleep_state()
  const wpm = await client.get_wpm()
  const peripheralStatus: PeripheralStatus[] = []
  for (let i = 0; i < caps.num_split_peripherals; i++) {
    peripheralStatus.push(await client.get_peripheral_status(i))
  }
  return {
    batteryStatus,
    bleStatus,
    connectionStatus,
    connectionType,
    currentLayer,
    ledIndicator,
    lockStatus,
    matrixState,
    peripheralStatus,
    sleepState,
    wpm,
  }
}

function invalid(cause: string): ResultAsync<void, KeyboardError> {
  return errAsync<void, KeyboardError>({ type: 'invalid', cause })
}

class KeyboardStoreClass {
  #connection = $state<ConnectionState | null>(null)
  #device = $state<KeyboardDevice | null>(null)
  #config = $state<KeyboardConfig | null>(null)
  #status = $state<KeyboardStatus | null>(null)

  get connection() { return this.#connection }
  get device() { return this.#device }
  get config() { return this.#config }
  get status() { return this.#status }

  private async startTopicLoop(client: RynkClient): Promise<void> {
    try {
      while (session.client === client) {
        const event = await client.next_topic()
        if (session.client !== client) break
        if (!session.topicsReady) continue
        match(event)
          .with({ LayerChange: P.select() }, (x) => { this.#status!.currentLayer = x })
          .with({ WpmUpdate: P.select() }, (x) => { this.#status!.wpm = x })
          .with({ ConnectionChange: P.select() }, (x) => { this.#status!.connectionStatus = x })
          .with({ SleepState: P.select() }, (x) => { this.#status!.sleepState = x })
          .with({ LedIndicatorChange: P.select() }, (x) => { this.#status!.ledIndicator = x })
          .with({ BatteryStatusChange: P.select() }, (x) => { this.#status!.batteryStatus = x })
          .exhaustive()
      }
    } catch (e) {
      // next_topic() only rejects when the link dies. A teardown already in
      // flight nulls session.client first, so handleDeath no-ops in that case.
      await this.handleDeath(client, toKeyboardError(e), true)
    }
  }

  /// `fromTopicLoop` marks the caller as the topic loop itself, so teardown
  /// skips awaiting it — awaiting your own promise deadlocks.
  private async handleDeath(client: RynkClient, cause: KeyboardError, fromTopicLoop: boolean): Promise<void> {
    if (session.client !== client) return
    await this.teardown({ phase: 'error', label: this.#connection?.label ?? '', cause }, fromTopicLoop)
  }

  private async teardown(next: ConnectionState | null, fromTopicLoop = false): Promise<void> {
    const connected = session.connected
    const client = session.client
    const topicLoop = fromTopicLoop ? null : session.topicLoop
    session.connected = null
    session.client = null
    session.topicLoop = null
    session.chain = Promise.resolve()
    session.topicsReady = false
    session.onDeath = null
    this.#connection = next
    this.#device = null
    this.#config = null
    this.#status = null
    // Order matters: a parked next_topic() borrows the client, so free() must
    // wait for the link EOF to unwind the topic loop or wasm-bindgen throws.
    await connected?.link?.close()
    await topicLoop
    client?.free()
  }

  private async doInit(connected: ConnectedDevice): Promise<void> {
    session.connected = connected
    try {
      this.#connection = { phase: 'connecting', label: connected.label }

      const { client } = await connectClient(connected.link)
      session.client = client
      session.onDeath = (cause) => {
        void this.handleDeath(client, cause, false)
      }
      session.topicLoop = this.startTopicLoop(client)

      const version = await client.get_version()
      const info = await client.get_device_info()
      const capabilities = await client.get_capabilities()
      const layout = await client.get_layout()
      const newConfig = await fetchConfig(client, capabilities)
      const newStatus = await fetchStatus(client, capabilities)

      const newDevice: KeyboardDevice = {
        capabilities,
        info,
        version,
        layout,
      }
      // Prefer the name the keyboard reports over the transport label: Web
      // Serial only ever offers the constant 'WebSerial', since getInfo()
      // exposes no string descriptors. Earlier phases keep the transport label —
      // there is no device info before the handshake.
      this.#connection = { phase: 'connected', label: info.product_name.trim() || connected.label }
      this.#device = newDevice
      this.#config = newConfig
      this.#status = newStatus
      session.chain = Promise.resolve()
      session.topicsReady = true
    } catch (e) {
      await this.teardown({ phase: 'error', label: connected.label, cause: toKeyboardError(e) })
      throw e
    }
  }

  initStore(connected: ConnectedDevice): ResultAsync<void, KeyboardError> {
    return ResultAsync.fromThrowable(() => this.doInit(connected), toKeyboardError)()
  }

  /// Hard reset: drops the session and leaves no connection state behind.
  async resetStore(): Promise<void> {
    await this.teardown(null)
  }

  /// User-initiated close; keeps the label visible so the UI can offer a reconnect.
  async disconnect(): Promise<void> {
    await this.teardown(
      this.#connection ? { phase: 'disconnected', label: this.#connection.label } : null,
    )
  }

  setKey(
    layer: number,
    row: number,
    col: number,
    action: KeyAction,
  ): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    const layerArr = this.#config.keymap[layer]
    if (!layerArr) return invalid(`layer ${layer} out of range`)
    const rowArr = layerArr[row]
    if (!rowArr) return invalid(`row ${row} out of range`)
    if (col < 0 || col >= rowArr.length) return invalid(`col ${col} out of range`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.keymap[layer]![row]![col]!
        this.#config!.keymap[layer]![row]![col] = action
        return snapshot
      },
      call: c => c.set_key(layer, row, col, action),
      undo: (snapshot) => { if (this.#config) this.#config.keymap[layer]![row]![col] = snapshot },
    })
  }

  /// Replace the whole keymap in one paged write instead of layers×rows×cols
  /// round trips. Shape must match the device geometry exactly.
  setKeymap(keymap: KeyAction[][][]): ResultAsync<void, KeyboardError> {
    const caps = this.#device?.capabilities
    if (!this.#config || !caps) return invalid('not connected')
    if (keymap.length !== caps.num_layers)
      return invalid(`keymap: ${keymap.length} layers, expected ${caps.num_layers}`)
    for (const [l, rows] of keymap.entries()) {
      if (rows.length !== caps.num_rows)
        return invalid(`keymap layer ${l}: ${rows.length} rows, expected ${caps.num_rows}`)
      for (const [r, row] of rows.entries()) {
        if (row.length !== caps.num_cols)
          return invalid(`keymap layer ${l} row ${r}: ${row.length} cols, expected ${caps.num_cols}`)
      }
    }
    // Layer-major, row-major — the order read_all_keymap returns.
    const flat = keymap.flat().flat()

    return runMutation({
      push: () => {
        const snapshot = this.#config!.keymap
        this.#config!.keymap = keymap
        return snapshot
      },
      call: c => c.write_all_keymap(flat),
      undo: (snapshot) => { if (this.#config) this.#config.keymap = snapshot },
    })
  }

  setCombos(combos: Combo[]): ResultAsync<void, KeyboardError> {
    const caps = this.#device?.capabilities
    if (!this.#config || !caps) return invalid('not connected')
    if (combos.length !== caps.max_combos)
      return invalid(`combos: ${combos.length}, expected ${caps.max_combos}`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.combos
        this.#config!.combos = combos
        return snapshot
      },
      call: c => c.write_all_combos(combos),
      undo: (snapshot) => { if (this.#config) this.#config.combos = snapshot },
    })
  }

  setMorses(morses: Morse[]): ResultAsync<void, KeyboardError> {
    const caps = this.#device?.capabilities
    if (!this.#config || !caps) return invalid('not connected')
    if (morses.length !== caps.max_morse)
      return invalid(`morses: ${morses.length}, expected ${caps.max_morse}`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.morses
        this.#config!.morses = morses
        return snapshot
      },
      call: c => c.write_all_morses(morses),
      undo: (snapshot) => { if (this.#config) this.#config.morses = snapshot },
    })
  }

  setEncoder(
    encoderId: number,
    layer: number,
    action: EncoderAction,
  ): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    const enc = this.#config.encoders[encoderId]
    if (!enc) return invalid(`encoder ${encoderId} out of range`)
    if (layer < 0 || layer >= enc.length) return invalid(`layer ${layer} out of range`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.encoders[encoderId]![layer]!
        this.#config!.encoders[encoderId]![layer] = action
        return snapshot
      },
      call: c => c.set_encoder(encoderId, layer, action),
      undo: (snapshot) => { if (this.#config) this.#config.encoders[encoderId]![layer] = snapshot },
    })
  }

  setCombo(index: number, combo: Combo): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    if (index < 0 || index >= this.#config.combos.length) return invalid(`combo ${index} out of range`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.combos[index]!
        this.#config!.combos[index] = combo
        return snapshot
      },
      call: c => c.set_combo(index, combo),
      undo: (snapshot) => { if (this.#config) this.#config.combos[index] = snapshot },
    })
  }

  setMorse(index: number, morse: Morse): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    if (index < 0 || index >= this.#config.morses.length) return invalid(`morse ${index} out of range`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.morses[index]!
        this.#config!.morses[index] = morse
        return snapshot
      },
      call: c => c.set_morse(index, morse),
      undo: (snapshot) => { if (this.#config) this.#config.morses[index] = snapshot },
    })
  }

  setFork(index: number, fork: Fork): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    if (index < 0 || index >= this.#config.forks.length) return invalid(`fork ${index} out of range`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.forks[index]!
        this.#config!.forks[index] = fork
        return snapshot
      },
      call: c => c.set_fork(index, fork),
      undo: (snapshot) => { if (this.#config) this.#config.forks[index] = snapshot },
    })
  }

  setMacro(offset: number, data: MacroData): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    const bytes = data.data
    if (offset < 0 || offset + bytes.length > this.#config.macros.length)
      return invalid(`macro offset ${offset}+${bytes.length} out of range`)

    return runMutation({
      push: () => {
        const snapshot = bytes.map((_, i) => this.#config!.macros[offset + i]!)
        bytes.forEach((b, i) => {
          this.#config!.macros[offset + i] = b
        })
        return snapshot
      },
      call: c => c.set_macro(offset, data),
      undo: (snapshot) => {
        if (!this.#config) return
        snapshot.forEach((old, i) => {
          this.#config!.macros[offset + i] = old
        })
      },
    })
  }

  /// Replace the whole macro region. Macros are one packed byte run with no
  /// per-slot addressing, so editing any of them rewrites all of them; the
  /// chunked writes share a chain slot to keep that atomic from the UI's side.
  setMacroRegion(bytes: number[]): ResultAsync<void, KeyboardError> {
    const caps = this.#device?.capabilities
    if (!this.#config || !caps) return invalid('not connected')
    if (bytes.length !== caps.macro_space_size)
      return invalid(`macros: ${bytes.length} bytes, expected ${caps.macro_space_size}`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.macros
        this.#config!.macros = bytes
        return snapshot
      },
      call: async (c) => {
        const chunk = Math.max(1, caps.macro_chunk_size)
        for (let offset = 0; offset < bytes.length; offset += chunk) {
          await c.set_macro(offset, { data: bytes.slice(offset, offset + chunk) })
        }
      },
      undo: (snapshot) => { if (this.#config) this.#config.macros = snapshot },
    })
  }

  setBehavior(behavior: BehaviorConfig): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')

    return runMutation({
      push: () => {
        const snapshot = this.#config!.behavior
        this.#config!.behavior = behavior
        return snapshot
      },
      call: c => c.set_behavior(behavior),
      undo: (snapshot) => { if (this.#config) this.#config.behavior = snapshot },
    })
  }

  setDefaultLayer(layer: number): ResultAsync<void, KeyboardError> {
    if (!this.#config) return invalid('not connected')
    if (layer < 0 || layer >= this.#config.keymap.length)
      return invalid(`default layer ${layer} out of range`)

    return runMutation({
      push: () => {
        const snapshot = this.#config!.defaultLayer
        this.#config!.defaultLayer = layer
        return snapshot
      },
      call: c => c.set_default_layer(layer),
      undo: (snapshot) => { if (this.#config) this.#config.defaultLayer = snapshot },
    })
  }

  /// Re-poll everything topic pushes don't cover (matrix, peripherals, lock).
  refreshStatus(): ResultAsync<void, KeyboardError> {
    const caps = this.#device?.capabilities
    if (!caps) return notConnected<void>()
    return runCommand(async (c) => {
      this.#status = await fetchStatus(c, caps)
    })
  }

  /// Matrix state has no topic push, so a live view polls it. Unlock-gated:
  /// rejects with `Locked` until the ceremony completes.
  refreshMatrix(): ResultAsync<MatrixState, KeyboardError> {
    return runCommand(c => c.get_matrix_state())
      .andTee((m) => { if (this.#status) this.#status.matrixState = m })
  }

  refreshLockStatus(): ResultAsync<LockStatus, KeyboardError> {
    return runCommand(c => c.get_lock_status())
      .andTee((s) => { if (this.#status) this.#status.lockStatus = s })
  }

  lock(): ResultAsync<void, KeyboardError> {
    return runCommand(async (c) => {
      await c.lock()
      const status = await c.get_lock_status()
      if (!this.#status) return
      this.#status.lockStatus = status
      // Matrix state is unlock-gated, so the cached bitmap is now unreadable.
      this.#status.matrixState = null
    })
  }

  /// One step of the unlock ceremony: the user holds `lockStatus.key_positions`
  /// while the host polls. Call until `locked` clears or `unlocking` lapses.
  unlockPoll(): ResultAsync<LockStatus, KeyboardError> {
    return runCommand(async (c) => {
      const status = await c.unlock_poll()
      if (this.#status) {
        this.#status.lockStatus = status
        if (!status.locked && !this.#status.matrixState)
          this.#status.matrixState = await c.get_matrix_state()
      }
      return status
    })
  }

  refreshBleStatus(): ResultAsync<BleStatus, KeyboardError> {
    return runCommand(c => c.get_ble_status())
      .andTee((s) => { if (this.#status) this.#status.bleStatus = s })
  }

  switchBleProfile(slot: number): ResultAsync<void, KeyboardError> {
    return this.bleProfileCmd(slot, (c, s) => c.switch_ble_profile(s))
  }

  /// Unlock-gated upstream: deleting a bond opens a re-pair hijack window.
  clearBleProfile(slot: number): ResultAsync<void, KeyboardError> {
    return this.bleProfileCmd(slot, (c, s) => c.clear_ble_profile(s))
  }

  private bleProfileCmd(
    slot: number,
    call: (c: RynkClient, slot: number) => Promise<void>,
  ): ResultAsync<void, KeyboardError> {
    const caps = this.#device?.capabilities
    if (!caps) return notConnected<void>()
    if (!caps.ble_enabled) return invalid('device has no BLE')
    if (slot < 0 || slot >= caps.num_ble_profiles) return invalid(`ble profile ${slot} out of range`)
    return runCommand(async (c) => {
      await call(c, slot)
      if (this.#status) this.#status.bleStatus = await c.get_ble_status()
    })
  }

  reboot(): ResultAsync<void, KeyboardError> {
    return this.endSession(c => c.reboot())
  }

  bootloaderJump(): ResultAsync<void, KeyboardError> {
    return this.endSession(c => c.bootloader_jump())
  }

  /// Firmware only implements `Full`; `LayoutOnly` comes back `Unimplemented`.
  /// The refetch shares this chain slot so nothing reads the wiped config.
  storageReset(mode: StorageResetMode): ResultAsync<void, KeyboardError> {
    const caps = this.#device?.capabilities
    if (!caps) return notConnected<void>()
    return runCommand(async (c) => {
      await c.storage_reset(mode)
      this.#config = await fetchConfig(c, caps)
    })
  }

  /// Reboot and bootloader jump are fire-and-forget upstream — the device resets
  /// before it can reply, so the ack may never land. The session is gone either
  /// way, so the teardown runs on both outcomes and is awaited before we settle:
  /// a caller that reconnects immediately must not race a half-closed link.
  private endSession(call: (c: RynkClient) => Promise<void>): ResultAsync<void, KeyboardError> {
    const label = this.#connection?.label ?? ''
    // Never rejects: a close() fault must not mask the command's own outcome.
    const close = () => ResultAsync.fromSafePromise(
      this.teardown({ phase: 'disconnected', label }).catch(() => {}),
    )
    return runCommand(call)
      .andThrough(close)
      // `invalid` is the not-connected guard: the command never reached the
      // device, so leave whatever phase the death path already recorded.
      .orElse(e => (e.type === 'invalid'
        ? errAsync<void, KeyboardError>(e)
        : close().andThen(() => errAsync<void, KeyboardError>(e))))
  }
}

export const keyboardStore = new KeyboardStoreClass()
