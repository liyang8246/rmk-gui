<script lang='ts'>
  import type { Variant } from '../rynk'
  import { keyboardStore } from '../stores'

  const KEY_UNIT = 64

  let selected = $state<string | null>(null)

  const variant = $derived.by<Variant | null>(() => {
    const layout = keyboardStore.device?.layout
    if (!layout || layout.variants.length === 0)
      return null
    const idx = Math.min(layout.default_variant, layout.variants.length - 1)
    return layout.variants[idx]!
  })

  function keyId(row: number, col: number): string {
    return `${row},${col}`
  }

  const bounds = $derived.by(() => {
    const keys = variant?.keys ?? []
    if (keys.length === 0)
      return { minX: 0, minY: 0, w: 0, h: 0 }
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    const pts: [number, number][] = []
    const addRect = (rc: { x: number, y: number, w: number, h: number }) => {
      pts.push(
        [rc.x - rc.w / 2, rc.y - rc.h / 2],
        [rc.x + rc.w / 2, rc.y - rc.h / 2],
        [rc.x - rc.w / 2, rc.y + rc.h / 2],
        [rc.x + rc.w / 2, rc.y + rc.h / 2],
      )
    }
    for (const k of keys) {
      const r = k.rect
      const cx = r.x
      const cy = r.y
      pts.length = 0
      addRect(r)
      if (k.rect2)
        addRect(k.rect2)
      const rad = (k.r * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      for (const [px, py] of pts) {
        const dx = px - cx
        const dy = py - cy
        const rx = cx + dx * cos - dy * sin
        const ry = cy + dx * sin + dy * cos
        if (rx < minX)
          minX = rx
        if (ry < minY)
          minY = ry
        if (rx > maxX)
          maxX = rx
        if (ry > maxY)
          maxY = ry
      }
    }
    return { minX, minY, w: (maxX - minX) * KEY_UNIT, h: (maxY - minY) * KEY_UNIT }
  })

  function keyStyle(key: Variant['keys'][number]): string {
    const r = key.rect
    const b = bounds
    const left = (r.x - r.w / 2 - b.minX) * KEY_UNIT
    const top = (r.y - r.h / 2 - b.minY) * KEY_UNIT
    return [
      `width:${r.w * KEY_UNIT}px`,
      `height:${r.h * KEY_UNIT}px`,
      `left:${left}px`,
      `top:${top}px`,
      `transform:rotate(${key.r}deg)`,
      'transform-origin:center',
    ].join(';')
  }
</script>

<div
  class='relative mx-auto my-0'
  role='presentation'
  style={`width:${bounds.w}px;height:${bounds.h}px`}
  onpointerdown={() => { selected = null }}
>
  {#each variant?.keys ?? [] as key (keyId(key.row, key.col))}
    <div
      class='
        absolute cursor-pointer rounded-lg
        {selected === keyId(key.row, key.col)
          ? `bg-primary`
          : `bg-base-300`}'
      role='button'
      tabindex='0'
      style={keyStyle(key)}
      onpointerdown={(e) => {
        e.stopPropagation()
        selected = keyId(key.row, key.col)
      }}
    ></div>
  {/each}
</div>
