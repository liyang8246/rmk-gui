import { mount } from 'svelte'
import App from './App.svelte'
import { registerIcons } from './lib/icons'
import './assets/css/main.css'

registerIcons()

const app = mount(App, { target: document.getElementById('app')! })

export default app
