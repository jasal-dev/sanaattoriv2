import { WordlePage } from './games/wordle/WordlePage'

function App() {
  return (
    <main className="flex min-h-svh flex-col items-center gap-6 px-4 py-8 text-center">
      <div>
        <h1 className="text-3xl font-semibold">Sanaattori</h1>
        <p className="text-neutral-500">Suomenkielisten sanapelien portaali</p>
      </div>
      <WordlePage />
    </main>
  )
}

export default App
