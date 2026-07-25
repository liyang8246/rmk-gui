import type { Accessor, JSX } from 'solid-js'
import { Dialog } from '@ark-ui/solid/dialog'
import { Icon } from '@iconify-icon/solid'
import { createSignal, onCleanup, Show } from 'solid-js'
import { Portal, render } from 'solid-js/web'

export type ModalContent = (props: { close: () => void }) => JSX.Element

export interface ModalOptions {
  title?: JSX.Element
  showCloseButton?: boolean
}

export interface ModalHandle {
  open: () => void
  close: () => void
  opening: Accessor<boolean>
  dispose: () => void
}

export function useModal(content: ModalContent, options: ModalOptions = {}): ModalHandle {
  const [opening, setOpen] = createSignal(false)
  const open = () => setOpen(true)
  const close = () => setOpen(false)

  const mount = document.createElement('div')
  document.body.appendChild(mount)

  const disposeRender = render(
    () => (
      <Dialog.Root
        open={opening()}
        onOpenChange={e => setOpen(e.open)}
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop class="fixed inset-0 bg-black/25 backdrop-blur-xs" />
          <Dialog.Positioner class="
            fixed inset-0 flex items-center justify-center
          "
          >
            <Dialog.Content class="rounded-lg bg-base-100 p-4">
              <Show when={options.title || options.showCloseButton}>
                <div class="flex items-center justify-between text-base-content">
                  <Show when={options.title}>
                    <Dialog.Title>{options.title}</Dialog.Title>
                  </Show>
                  <Show when={options.showCloseButton}>
                    <Dialog.CloseTrigger
                      aria-label="Close"
                      class="flex items-center"
                    >
                      <Icon icon="lucide:x" />
                    </Dialog.CloseTrigger>
                  </Show>
                </div>
              </Show>
              {content({ close })}
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    ),
    mount,
  )

  const dispose = () => {
    disposeRender()
    mount.remove()
  }

  onCleanup(dispose)

  return { open, close, opening, dispose }
}
