import { createSignal } from 'solid-js'
import ToolsBar from './components/ToolsBar'

function App() {
  const [greetText] = createSignal('Hello World!')

  return (
    <div class="
      flex h-screen w-screen flex-col items-center gap-4 grid-canvas bg-base-100
      p-8
    "
    >
      <p>{greetText()}</p>
      <ToolsBar />
    </div>
  )
}

export default App
