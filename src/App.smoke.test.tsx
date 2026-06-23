// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import App from './App'

afterEach(cleanup)

describe('App (smoke)', () => {
  it('mounts and renders the verdict, chart heading and inputs', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /Rent vs Buy/i })).toBeTruthy()
    // The verdict line always renders one of "Buying/Renting comes out ahead by …".
    expect(screen.getByText(/comes out ahead by/i)).toBeTruthy()
    expect(screen.getByText(/Net worth over time/i)).toBeTruthy()
    expect(screen.getByText(/PIR \(investor tax rate\)/i)).toBeTruthy()
  })
})
