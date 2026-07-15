import type { Component } from 'solid-js'
import { Icon } from '@iconify-icon/solid'

const ToolButton: Component<{
  name: string
  icon: string
  onClick: () => void
}> = (props) => {
  return (
    <button
      class="
        flex items-center gap-2 rounded-lg px-3 py-2 transition-colors
        hover:bg-base-200
      "
      onClick={() => props.onClick()}
    >
      <Icon icon={props.icon} class="text-lg" />
      <span class="text-sm">{props.name}</span>
    </button>
  )
}

const ToolsBar: Component = () => {
  return (
    <div class="
      flex h-12 w-fit items-center rounded-xl bg-base-100 ring ring-base-300
    "
    >
      <ToolButton name="选择" icon="lucide:mouse-pointer-2" onClick={() => {}} />
      <ToolButton name="画笔" icon="lucide:pencil" onClick={() => {}} />
      <ToolButton name="橡皮" icon="lucide:eraser" onClick={() => {}} />
    </div>
  )
}

export default ToolsBar
