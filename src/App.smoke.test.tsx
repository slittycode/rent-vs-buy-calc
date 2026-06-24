// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import App from './App'

afterEach(cleanup)

describe('App (smoke)', () => {
  it('mounts and renders the verdict, chart heading and inputs', () => {
    const { container } = render(<App />)
    expect(screen.getByRole('heading', { name: 'Rent vs Buy — New Zealand' })).toBeTruthy()
    // The verdict line always renders one of "Buying/Renting comes out ahead by …".
    expect(screen.getByText(/comes out ahead by/i)).toBeTruthy()
    expect(screen.getByText(/Net worth over time/i)).toBeTruthy()
    expect(screen.getByText(/Investment return mix/i)).toBeTruthy()
    expect(screen.getByText(/Location & tax/i)).toBeTruthy()

    const text = container.textContent ?? ''
    expect(text).not.toMatch(/Canadian province/i)
    expect(text).not.toMatch(/eligible dividends/i)
    expect(text).not.toMatch(/after selling costs/i)
    expect(text).toMatch(/FIF rules/i)
    expect(text).toMatch(/PIE\/PIR tax treatment/i)
    expect(text).toMatch(/dividend imputation credits/i)
    expect(text).toMatch(/bright-line\/property-sale tax/i)
    expect(text).toMatch(/transaction costs are not modelled/i)
  })
})
