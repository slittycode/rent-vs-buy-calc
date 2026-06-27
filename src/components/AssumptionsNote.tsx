interface Props {
  marginalRatePct: number
  isPortfolioTaxable: boolean
}

export default function AssumptionsNote({ marginalRatePct, isPortfolioTaxable }: Props) {
  return (
    <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <summary className="cursor-pointer font-semibold text-slate-700">How this works & key assumptions</summary>
      <div className="mt-3 space-y-3 text-slate-600">
        <p>
          This follows the same rent-vs-buy field structure as the source calculator; the location is set to
          New&nbsp;Zealand, which drives NZ income-tax rates in this version.
        </p>
        <p>
          <strong>The comparison.</strong> Both paths are projected month by month. At purchase the buyer commits the
          deposit plus one-off buying costs (legal, LIM, building report), and the renter invests that same upfront cash
          instead — so the renter starts ahead by the buying costs. Each month whichever side has the lower housing cost
          invests the surplus. Net worth is the value if you cashed out that year: home value <strong>after selling
          costs</strong> (agent commission and legal) minus the mortgage, plus any side investments, versus the
          renter&rsquo;s portfolio. The default is a main-home buyer (exempt from bright-line tax); untick
          &ldquo;Main home&rdquo; to model an investment property, where a sale within 2 years is taxed on the gain at
          your marginal rate and netted out of the buyer&rsquo;s proceeds.
        </p>
        <p>
          <strong>Costs as a rate or a fixed sum.</strong> Council rates, maintenance, insurance, the deposit and the
          buying/selling costs can each be entered as a percentage of the home value or as a fixed dollar amount. A
          percentage tracks the home as it appreciates; a fixed dollar amount escalates with inflation. Rent grows at its
          own rate, separate from general inflation, and an investment fee (MER) is deducted from portfolio returns.
        </p>
        <p>
          <strong>NZ tax on investments.</strong> The portfolio return is split by tax type, then taxed under NZ rules:
          realized and unrealized <strong>capital gains are not taxed</strong> (no NZ CGT); dividends and interest are
          taxed at your marginal rate ({marginalRatePct.toFixed(1)}%); foreign withholding tax applies to foreign
          dividends.{' '}
          {isPortfolioTaxable
            ? 'Your portfolio is set to a taxable account.'
            : 'Your portfolio is set to a sheltered account, so only foreign withholding tax leaks out.'}{' '}
          There is no exit/capital-gains tax, so the final portfolio value is already after-tax.
        </p>
        <p>
          <strong>Caveats.</strong> Figures are in today&rsquo;s nominal dollars, a single fixed mortgage rate is assumed
          for the whole term, and returns are smooth averages. Buying/selling costs and bright-line property-sale tax are
          modelled, but FIF rules, PIE/PIR tax treatment, dividend imputation credits, mortgage low-equity premiums, and
          KiwiSaver first-home support are not. This is a simplified tool to aid thinking, not financial advice.
        </p>
        <p>
          <strong>Sharing and privacy.</strong> The app runs in your browser. It has no backend, accounts, API keys, or
          stored personal data. The share link puts the calculator inputs in the URL, so anyone with that link can see
          the scenario values you entered.
        </p>
      </div>
    </details>
  )
}
