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
          <strong>The comparison.</strong> Both paths are projected month by month. The renter invests the deposit plus
          the buyer&rsquo;s one-off purchase costs up front, then each month whichever side has the lower housing cost
          invests the surplus. Net worth = home value (less selling costs) − mortgage balance + any side investments,
          versus the renter&rsquo;s portfolio. One-off transaction costs are included: buying costs (legal, LIM,
          builder&rsquo;s report — NZ has no stamp duty) up front, and selling costs (agent commission plus legal)
          taken off the home&rsquo;s value at the horizon. This first version assumes a main-home buyer, not an
          investment-property landlord.
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
          for the whole term, and returns are smooth averages. Transaction costs are modelled only as flat percentages
          (no fixed-fee detail). Council rates and maintenance can each be entered as a % of the home&rsquo;s value or a
          fixed $/yr that grows with inflation. FIF rules, PIE/PIR tax treatment, dividend imputation credits, and
          bright-line/property-sale tax are not modelled. This is a simplified tool to aid thinking, not financial
          advice.
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
