/// <reference types="vite/client" />
/// <reference types="@types/w3c-web-serial" />

declare module '*.svelte' {
  import type { Component } from 'svelte'

  const component: Component
  export default component
}
