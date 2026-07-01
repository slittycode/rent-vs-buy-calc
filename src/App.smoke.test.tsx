// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import App from './App'

afterEach(cleanup)

describe('App (smoke)', () => {
  it('mounts and renders the PWL-style structure with NZ caveats', () => {
    const { container } = render(<App />)
    expect(screen.getByRole('heading', { name: 'Rent vs Buy — New Zealand' })).toBeTruthy()
    expect(screen.getByText(/Headline result/i)).toBeTruthy()
    expect(screen.getByText(/Renting final net worth/i)).toBeTruthy()
    expect(screen.getByText(/Buying final net worth/i)).toBeTruthy()
    expect(screen.getByText(/Advantage/i)).toBeTruthy()
    expect(screen.getByText(/Rent\/Purchase Price/i)).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Net Worth' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Cash Flow' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Renter Savings' })).toBeTruthy()
    expect(screen.getByText(/Net worth over time/i)).toBeTruthy()
    expect(screen.getAllByText(/Assumptions/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/^Buy$/i)).toBeTruthy()
    expect(screen.getAllByText(/^Rent$/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Expected Returns/i)).toBeTruthy()

    // New PWL-parity features: break-even rent, transaction costs, %/$ toggles.
    expect(screen.getAllByText(/Break-even rent/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Mortgage payment \(P&I\)/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Upfront cash to buy/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Buying costs/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'percentage' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'dollar amount' }).length).toBeGreaterThan(0)

    // Scenario comparison feature.
    expect(screen.getByRole('button', { name: /pin to compare/i })).toBeTruthy()

    const text = container.textContent ?? ''
    expect(text).not.toMatch(/Canadian province/i)
    expect(text).not.toMatch(/PWL Capital/i)
    expect(text).not.toMatch(/Meet with us/i)
    expect(text).not.toMatch(/eligible dividends/i)
    expect(text).toMatch(/after selling costs/i)
    expect(text).toMatch(/FIF rules/i)
    expect(text).toMatch(/PIE\/PIR tax treatment/i)
    expect(text).toMatch(/dividend imputation credits/i)
    expect(text).toMatch(/bright-line\/property-sale tax/i)
    expect(text).toMatch(/transaction costs are modelled/i)
    expect(text).toMatch(/no backend, accounts, API keys, or stored personal data/i)
    expect(text).toMatch(/share link puts the calculator inputs in the URL/i)
  })

  it('does not describe partial-period cash-flow bars as full annual values', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('tab', { name: 'Cash Flow' }))

    expect(screen.getByText(/Cash flow by period/i)).toBeTruthy()
    expect(screen.getByText(/Full-year points cover 12 months/i)).toBeTruthy()
    expect(screen.queryByText(/Annual cash flow adds up each year/i)).toBeNull()
  })

  it('clamps typed numeric assumptions before recalculating results', async () => {
    render(<App />)

    const horizonInput = screen.getByRole('spinbutton', { name: /Time horizon/i }) as HTMLInputElement

    fireEvent.change(horizonInput, {
      target: { value: '999' },
    })
    fireEvent.blur(horizonInput)

    await screen.findByDisplayValue('100')
    expect(horizonInput.value).toBe('100')
  })

  it('still resets return assumptions when asset allocation changes', () => {
    render(<App />)

    const assetAllocationSelect = screen.getAllByRole('combobox').find(
      (element) => (element as HTMLSelectElement).value === '80',
    )
    expect(assetAllocationSelect).toBeTruthy()

    fireEvent.change(assetAllocationSelect!, {
      target: { value: '100' },
    })

    expect((screen.getByRole('spinbutton', { name: /Interest income/i }) as HTMLInputElement).value).toBe('0')
    expect((screen.getByRole('spinbutton', { name: /Foreign dividends/i }) as HTMLInputElement).value).toBe('0.94')
  })
})
