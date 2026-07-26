import type { Component } from 'solid-js'
import type { Key } from '~/rynk'
import { createMemo, Show } from 'solid-js'

const KEY_UNIT = 64
const KEY_GAP = 3 // gap between adjacent keys (the root stays full grid size; visuals inset)
const FACE_GAP = 2 // border ring thickness: face inlays the border layer by this much

interface KeycapProps {
  key: Key
  selected?: boolean
  onSelect?: (row: number, col: number) => void
}

const Keycap: Component<KeycapProps> = (props) => {
  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    props.onSelect?.(props.key.row, props.key.col)
  }

  // rmk stores rect centers, not corners — convert rect2 to a top-left offset from primary
  const rect2 = createMemo(() => {
    const r2 = props.key.rect2
    if (!r2) return null
    const k = props.key.rect
    const left = (r2.x - r2.w / 2 - (k.x - k.w / 2)) * KEY_UNIT
    const top = (r2.y - r2.h / 2 - (k.y - k.h / 2)) * KEY_UNIT
    const w = r2.w * KEY_UNIT
    const h = r2.h * KEY_UNIT
    return {
      border: {
        left: `${left + KEY_GAP}px`,
        top: `${top + KEY_GAP}px`,
        width: `${w - KEY_GAP * 2}px`,
        height: `${h - KEY_GAP * 2}px`,
      },
      face: {
        left: `${left + KEY_GAP + FACE_GAP}px`,
        top: `${top + KEY_GAP + FACE_GAP}px`,
        width: `${w - KEY_GAP * 2 - FACE_GAP * 2}px`,
        height: `${h - KEY_GAP * 2 - FACE_GAP * 2}px`,
      },
    }
  })

  return (
    <div
      class="cursor-pointer"
      style={{
        width: `${props.key.rect.w * KEY_UNIT}px`,
        height: `${props.key.rect.h * KEY_UNIT}px`,
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        class="absolute rounded-lg"
        classList={{
          'bg-primary': props.selected,
          'bg-base-300': !props.selected,
        }}
        style={{ inset: `${KEY_GAP}px` }}
      />
      <Show when={rect2()}>
        {r2 => (
          <div
            class="absolute rounded-lg"
            classList={{
              'bg-primary': props.selected,
              'bg-base-300': !props.selected,
            }}
            style={r2().border}
          />
        )}
      </Show>
      <div
        class="absolute rounded-md bg-base-200"
        style={{ inset: `${KEY_GAP + FACE_GAP}px` }}
      />
      <Show when={rect2()}>
        {r2 => (
          <div class="absolute rounded-md bg-base-200" style={r2().face} />
        )}
      </Show>
    </div>
  )
}

export default Keycap
