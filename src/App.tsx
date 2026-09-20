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
const SanasuppiloRoute = lazy(() =>
  import('./games/sanasuppilo/SanasuppiloRoute').then((module) => ({
    default: module.SanasuppiloRoute,
  })),
)
const SanapiiloRoute = lazy(() =>
  import('./games/sanapiilo/SanapiiloRoute').then((module) => ({
    default: module.SanapiiloRoute,
  })),
)
const SanajahtiRoute = lazy(() =>
  import('./games/sanajahti/SanajahtiRoute').then((module) => ({
    default: module.SanajahtiRoute,
  })),
)
const SynonyymiristikkoRoute = lazy(() =>
  import('./games/synonyymiristikko/SynonyymiristikkoRoute').then((module) => ({
    default: module.SynonyymiristikkoRoute,
  })),
)
const SanasykeroRoute = lazy(() =>
  import('./games/sanasykero/SanasykeroRoute').then((module) => ({
    default: module.SanasykeroRoute,
  })),
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
            <Route
              path="/sanasuppilo"
              element={
                <Suspense fallback={null}>
                  <SanasuppiloRoute />
                </Suspense>
              }
            />
            <Route
              path="/sanapiilo"
              element={
                <Suspense fallback={null}>
                  <SanapiiloRoute />
                </Suspense>
              }
            />
            <Route
              path="/sanajahti"
              element={
                <Suspense fallback={null}>
                  <SanajahtiRoute />
                </Suspense>
              }
            />
            <Route
              path="/synonyymiristikko"
              element={
                <Suspense fallback={null}>
                  <SynonyymiristikkoRoute />
                </Suspense>
              }
            />
            <Route
              path="/sanasykero"
              element={
                <Suspense fallback={null}>
                  <SanasykeroRoute />
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
