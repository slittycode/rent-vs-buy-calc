interface Props {
  pir: number // PIR as a percent, e.g. 28
  marginalRatePct: number // marginal income tax rate as a percent, e.g. 33
}

export default function AssumptionsNote({ pir, marginalRatePct }: Props) {
  const fdrDragPct = (0.05 * pir).toFixed(2)

  return (
    <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <summary className="cursor-pointer font-semibold text-slate-700">How this works & key assumptions</summary>
      <div className="mt-3 space-y-3 text-slate-600">
        <p>
          <strong>The comparison.</strong> Both paths are projected month by month. Net worth in any year is what
          you&rsquo;d walk away with if you cashed out then: the buyer sells (paying selling costs) and clears the
          mortgage; the renter liquidates their portfolio. Whichever side has the lower housing cost in a month invests
          the surplus, so both paths use the same money. The renter also invests the deposit and purchase costs up front.
        </p>
        <p>
          <strong>Tax on the home.</strong> A main home pays no capital gains tax in NZ, so the home&rsquo;s growth is
          kept in full. There&rsquo;s no stamp duty; purchase costs cover legal fees and a building inspection.
        </p>
        <p>
          <strong>Tax on investments.</strong> The equity portion is treated as a global PIE fund under the Foreign
          Investment Fund / Fair Dividend Rate rules: 5% of value is deemed taxable each year at your PIR — a fixed{' '}
          <strong>{fdrDragPct}% drag</strong> at a {pir}% PIR, regardless of the actual return. Bonds/cash interest is
          taxed at your PIR. Crucially there is no capital gains or exit tax, so the final portfolio value is already
          after-tax.
        </p>
        <p>
          <strong>Caveats.</strong> Figures are in today&rsquo;s nominal dollars. A single fixed mortgage rate is
          assumed for the whole term, and returns are smooth averages (real markets are volatile). Your marginal income
          tax rate at this income is {marginalRatePct.toFixed(1)}%. This is a simplified model to aid thinking, not
          financial advice.
        </p>
      </div>
    </details>
  )
}
