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
        flex cursor-pointer items-center gap-1 rounded-xl p-2 text-base-content
        hover:bg-base-300
      "
      onClick={() => props.onClick()}
    >
      <Icon icon={props.icon} />
      <span class="text-sm">{props.name}</span>
    </button>
  )
}

const ToolsBar: Component = () => {
  return (
    <div class="
      flex h-12 w-fit items-center gap-1 rounded-xl bg-base-100 px-2 py-1
      shadow-lg ring ring-base-300
    "
    >
      <ToolButton name="Layers" icon="lucide:layers" onClick={() => {}} />
      <ToolButton name="Macros" icon="lucide:zap" onClick={() => {}} />
      <ToolButton name="Combos" icon="lucide:combine" onClick={() => {}} />
      <ToolButton name="Wireless" icon="lucide:bluetooth" onClick={() => {}} />
      <ToolButton name="Firmware" icon="lucide:cpu" onClick={() => {}} />
      <ToolButton name="Setting" icon="lucide:settings" onClick={() => {}} />
    </div>
  )
}

export default ToolsBar
