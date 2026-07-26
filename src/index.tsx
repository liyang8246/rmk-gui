/* @refresh reload */
import { render } from 'solid-js/web'
import App from './App'
import './assets/css/main.css'
import './assets/css/ark.css'

const root = document.getElementById('root')

render(() => <App />, root!)
