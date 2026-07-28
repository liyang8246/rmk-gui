import type { Component, InjectionKey } from 'vue'
import { defineStore } from 'pinia'
import { inject, markRaw, ref } from 'vue'

interface PageModalEntry {
  id: number
  component: Component
}

interface PageModalContext {
  close: () => void
}

const PAGE_MODAL_KEY: InjectionKey<PageModalContext> = Symbol('page-modal')

const usePageModalStore = defineStore('page-modal', () => {
  const stack = ref<PageModalEntry[]>([])
  let nextId = 0

  function open(component: Component) {
    const id = ++nextId
    stack.value.push({ id, component: markRaw(component) })
    return id
  }

  function close(id: number) {
    const idx = stack.value.findIndex(e => e.id === id)
    if (idx !== -1)
      stack.value.splice(idx, 1)
  }

  function closeAll() {
    stack.value = []
  }

  return { stack, open, close, closeAll }
})

function openPage(component: Component) {
  return usePageModalStore().open(component)
}

function closeAllPageModals() {
  usePageModalStore().closeAll()
}

function usePageModalContext(): PageModalContext {
  const ctx = inject(PAGE_MODAL_KEY, null)
  if (!ctx)
    throw new Error('[usePageModalContext] must be used within a component rendered by openPage')
  return ctx
}

export { closeAllPageModals, openPage, PAGE_MODAL_KEY, usePageModalContext, usePageModalStore }
export type { PageModalContext, PageModalEntry }
