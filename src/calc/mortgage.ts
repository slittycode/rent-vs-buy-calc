/**
 * Standard fully-amortising mortgage maths. A single fixed rate is assumed for
 * the whole term (the same simplification the PWL tool makes).
 */

/** Level monthly payment (principal + interest) for a fully-amortising loan. */
export function monthlyMortgagePayment(
  principal: number,
  annualRatePct: number,
  termYears: number,
): number {
  const n = Math.round(termYears * 12)
  if (n <= 0 || principal <= 0) return 0
  const r = annualRatePct / 100 / 12
  if (r === 0) return principal / n
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

/** Loan balance remaining after `monthsElapsed` payments. */
export function remainingBalance(
  principal: number,
  annualRatePct: number,
  termYears: number,
  monthsElapsed: number,
): number {
  if (principal <= 0) return 0
  const payment = monthlyMortgagePayment(principal, annualRatePct, termYears)
  const r = annualRatePct / 100 / 12
  let balance = principal
  for (let m = 0; m < monthsElapsed && balance > 0; m++) {
    const interest = balance * r
    let principalPaid = payment - interest
    if (principalPaid > balance) principalPaid = balance
    balance -= principalPaid
  }
  return balance < 0.005 ? 0 : balance
}
