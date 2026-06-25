// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import InfoTooltip from './InfoTooltip'

afterEach(cleanup)

describe('InfoTooltip', () => {
  it('hides text until tapped, then toggles it on each click', () => {
    render(<InfoTooltip text="Council rates explainer" />)

    // Hidden by default — a touch user sees only the "?" button.
    expect(screen.queryByText('Council rates explainer')).toBeNull()

    const button = screen.getByRole('button', { name: /more info/i })

    // A tap (click) reveals the help.
    fireEvent.click(button)
    expect(screen.getByRole('tooltip').textContent).toBe('Council rates explainer')
    expect(button.getAttribute('aria-expanded')).toBe('true')

    // Tapping again dismisses it.
    fireEvent.click(button)
    expect(screen.queryByText('Council rates explainer')).toBeNull()
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })
})
