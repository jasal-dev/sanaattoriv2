import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nProvider'
import { HomePage } from './portal/HomePage'
import { Layout } from './portal/Layout'

// The game itself (logic, board/keyboard UI, word lists) only ever matters
// on /sanuri and /sanuri-pro, so it's split into its own chunk — a portal
// visitor who never opens a game never downloads it.
const SanuriRoute = lazy(() =>
  import('./games/sanuri/SanuriRoute').then((module) => ({ default: module.SanuriRoute })),
)

function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/sanuri"
              element={
                <Suspense fallback={null}>
                  <SanuriRoute variant="easy" />
                </Suspense>
              }
            />
            <Route
              path="/sanuri-pro"
              element={
                <Suspense fallback={null}>
                  <SanuriRoute variant="pro" />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}

export default App
