import type { Component } from 'svelte'

export interface PageEntry {
  title: string
  component: Component
}

class Navigator {
  stack = $state<PageEntry[]>([])

  open(page: PageEntry) { this.stack = [page] }

  push(page: PageEntry) { this.stack.push(page) }

  close() { this.stack = [] }

  back() {
    if (this.stack.length > 1) this.stack.pop()
    else this.stack = []
  }
}

export const nav = new Navigator()
