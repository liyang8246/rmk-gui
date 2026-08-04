/// <reference types="vite/client" />
/// <reference types="@types/w3c-web-serial" />
/// <reference types="@types/w3c-web-hid" />

declare module '*.svelte' {
  import type { Component } from 'svelte'

  const component: Component
  export default component
}
