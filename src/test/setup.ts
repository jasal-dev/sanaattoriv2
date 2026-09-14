import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Without vitest's `globals: true`, @testing-library/react's automatic
// afterEach cleanup never registers, so renders from one test would stay
// mounted into the next.
afterEach(() => {
  cleanup()
})
