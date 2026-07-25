import type { Component } from 'solid-js'
import { Icon } from '@iconify-icon/solid'
import { createSignal } from 'solid-js'
import { useModal } from '~/hooks/useModal'
import { useToast } from '~/hooks/useToast'

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
  const [count, setCount] = createSignal(0)
  const settingsModal = useModal(
    props => (
      <div class="flex gap-2 p-2">
        <button
          class="
            cursor-pointer rounded-lg bg-primary px-3 py-1 text-primary-content
          "
          onClick={() => setCount(c => c + 1)}
        >
          +1
        </button>
        <span class="text-sm">
          {count()}
        </span>
        <button
          class="cursor-pointer rounded-lg px-3 py-1 ring ring-base-300"
          onClick={() => props.close()}
        >
          Close
        </button>
      </div>
    ),
    { title: '设置', showCloseButton: true },
  )
  const firmwareToast = useToast(
    props => (
      <div class="flex items-center gap-2">
        <span class="text-sm">固件已就绪</span>
        <button
          class="cursor-pointer text-xs text-primary"
          onClick={() => props.close()}
        >
          知道了
        </button>
      </div>
    ),
    { type: 'success' },
  )

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
      <ToolButton name="Firmware" icon="lucide:cpu" onClick={() => firmwareToast()} />
      <ToolButton name="Setting" icon="lucide:settings" onClick={() => settingsModal.open()} />
    </div>
  )
}

export default ToolsBar
