import type { JsByteLink } from './core'
import type { RynkClient, TopicEvent } from './wasm/rynk_wasm.js'
import { connect } from './core'

export interface Session {
  readonly client: RynkClient
  readonly label: string
  onTopic: (cb: (event: TopicEvent) => void) => () => void
  close: () => Promise<void>
}

export async function connectSession(
  link: JsByteLink,
  label: string,
  onDeath?: (cause: unknown) => void,
): Promise<Session> {
  const client = await connect(link)
  const topics = new Set<(event: TopicEvent) => void>()
  let closed = false
  let loop: Promise<void> = Promise.resolve()
  let teardown: Promise<void> | null = null

  function finish(fromLoop: boolean): Promise<void> {
    teardown ??= (async () => {
      closed = true
      await link.close()
      if (!fromLoop) await loop
      client.free()
    })()
    return teardown
  }

  async function runLoop(): Promise<void> {
    try {
      while (true) {
        const event = await client.next_topic()
        if (closed) break
        for (const cb of topics) cb(event)
      }
    } catch (cause) {
      if (closed) return
      await finish(true).catch(() => {})
      onDeath?.(cause)
    }
  }

  loop = runLoop()

  return {
    client,
    label,
    onTopic(cb) {
      topics.add(cb)
      return () => topics.delete(cb)
    },
    close: () => finish(false),
  }
}
