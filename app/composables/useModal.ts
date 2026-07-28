import type { Component, InjectionKey } from 'vue'
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import {
  createVNode,
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  onScopeDispose,
  provide,
  ref,
  render,
} from 'vue'

interface ModalContext {
  close: () => void
}

const MODAL_KEY: InjectionKey<ModalContext> = Symbol('modal')

function useModalContext(): ModalContext {
  const ctx = inject(MODAL_KEY, null)
  if (!ctx)
    throw new Error('[useModalContext] must be used within a component rendered by useModal')
  return ctx
}

function useModal(component: Component): { close: () => void } {
  const open = ref(true)
  const container = document.createElement('div')
  document.body.appendChild(container)

  function close() {
    open.value = false
    render(null, container)
    container.remove()
  }

  const instance = getCurrentInstance()

  const host = defineComponent({
    name: 'ModalHost',
    setup() {
      provide(MODAL_KEY, { close })

      return () =>
        h(
          DialogRoot,
          {
            'open': open.value,
            'onUpdate:open': (v: boolean) => {
              open.value = v
            },
          },
          () =>
            h(DialogPortal, () => [
              h(DialogOverlay, { class: 'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm' }),
              h(
                DialogContent,
                {
                  class:
                    'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2'
                    + ' rounded-xl bg-base-100 p-6 shadow-xl ring-1 ring-base-300',
                },
                () => [
                  h(DialogTitle, { class: 'sr-only' }, () => 'Dialog'),
                  h(component),
                ],
              ),
            ]),
        )
    },
  })

  const vnode = createVNode(host)
  if (instance?.appContext)
    vnode.appContext = instance.appContext
  render(vnode, container)

  onScopeDispose(close)

  return { close }
}

export { useModal, useModalContext }
