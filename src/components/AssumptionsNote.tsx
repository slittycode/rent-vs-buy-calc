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
          <strong>The comparison.</strong> Both paths are projected month by month. The renter invests the down payment
          up front, then each month whichever side has the lower housing cost invests the surplus. Net worth = home
          value − mortgage balance + any side investments, versus the renter&rsquo;s portfolio. No buying/selling
          transaction costs are modelled. This first version assumes a main-home buyer, not an investment-property
          landlord.
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
          for the whole term, and returns are smooth averages. FIF rules, PIE/PIR tax treatment, dividend imputation
          credits, bright-line/property-sale tax, and transaction costs are not modelled. This is a simplified tool to
          aid thinking, not financial advice.
        </p>
      </div>
    </details>
  )
}
