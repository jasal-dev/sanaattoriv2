import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SanuriRoute } from './games/sanuri/SanuriRoute'
import { I18nProvider } from './i18n/I18nProvider'
import { HomePage } from './portal/HomePage'
import { Layout } from './portal/Layout'

function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/sanuri" element={<SanuriRoute variant="easy" />} />
            <Route path="/sanuri-pro" element={<SanuriRoute variant="pro" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}

export default App
