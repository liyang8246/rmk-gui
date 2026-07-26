import type { Accessor, Component, JSX } from 'solid-js'
import { Dialog } from '@ark-ui/solid/dialog'
import { Icon } from '@iconify-icon/solid'
import { createSignal, For, onCleanup, Show } from 'solid-js'

export type ModalContent = (props: { close: () => void }) => JSX.Element

export interface ModalOptions {
  title?: JSX.Element
  showCloseButton?: boolean
}

export interface ModalHandle {
  open: () => void
  close: () => void
  opening: Accessor<boolean>
}

interface ModalInstance {
  id: number
  content: ModalContent
  options: ModalOptions
  opening: Accessor<boolean>
  setOpen: (v: boolean) => void
}

let nextId = 0
const [instances, setInstances] = createSignal<ModalInstance[]>([])

// Top-level sibling of #root; no transform/overflow ancestors
export const ModalProvider: Component = () => {
  return (
    <For each={instances()}>
      {inst => (
        <Dialog.Root
          open={inst.opening()}
          onOpenChange={e => inst.setOpen(e.open)}
          lazyMount
          unmountOnExit
        >
          <Dialog.Backdrop class="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <Dialog.Positioner class="
            fixed inset-0 flex items-center justify-center
          "
          >
            <Dialog.Content class="bg-base-100 p-6">
              <Show when={inst.options.title !== undefined}>
                <Dialog.Title>{inst.options.title}</Dialog.Title>
              </Show>
              <Show when={inst.options.showCloseButton ?? true}>
                <Dialog.CloseTrigger aria-label="Close">
                  <Icon icon="lucide:x" />
                </Dialog.CloseTrigger>
              </Show>
              {inst.content({ close: () => inst.setOpen(false) })}
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      )}
    </For>
  )
}

export function useModal(content: ModalContent, options: ModalOptions = {}): ModalHandle {
  const [opening, setOpen] = createSignal(false)
  const inst: ModalInstance = { id: nextId++, content, options, opening, setOpen }
  setInstances(p => [...p, inst])
  onCleanup(() => setInstances(p => p.filter(i => i.id !== inst.id)))
  return {
    open: () => setOpen(true),
    close: () => setOpen(false),
    opening,
  }
}
