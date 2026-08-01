import type { Component } from 'svelte'

export interface PageEntry {
  id: string
  title: string
  component: Component<any>
  props?: Record<string, unknown>
}

export interface StackEntry extends PageEntry {
  uid: string
}

let seq = 0

class Navigator {
  stack = $state<StackEntry[]>([])

  get current() { return this.stack[this.stack.length - 1] ?? null }

  open(page: PageEntry) {
    this.stack = [{ ...page, uid: `${page.id}#${seq++}` }]
  }

  push(page: PageEntry) {
    this.stack.push({ ...page, uid: `${page.id}#${seq++}` })
  }

  back() {
    if (this.stack.length > 1) this.stack.pop()
    else this.stack = []
  }

  close() {
    this.stack = []
  }
}

export const nav = new Navigator()
