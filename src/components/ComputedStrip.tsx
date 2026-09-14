import { formatILS, formatPercent, formatYears } from '../calc/format.ts'
import type { DismissalBreakdown } from '../calc/piturin.ts'

type Props = {
  dismissal: DismissalBreakdown
  x: number
}

export function ComputedStrip({ dismissal, x }: Props) {
  const taxableShare = Math.max(0, 1 - dismissal.z)

  return (
    <section className="computed" aria-label="ערכים מחושבים">
      <h2>מחושב אוטומטית</h2>
      <div className="computed__grid">
        <Stat label="ותק בשנים" value={formatYears(dismissal.tenureYears)} />
        <Stat label="שנים עד פרישה (n)" value={formatYears(dismissal.n, 0)} />
        <Stat label="סכום פטור" value={formatILS(dismissal.exemptAmount)} />
        <Stat label="שיעור פטור (z)" value={formatPercent(dismissal.z, 1)} />
      </div>
      <div className="composition" aria-hidden={x <= 0}>
        <div className="composition__bar">
          <span className="composition__exempt" style={{ flexGrow: dismissal.z }} />
          <span className="composition__taxable" style={{ flexGrow: taxableShare }} />
        </div>
        <div className="composition__legend">
          <span>פטור {formatPercent(dismissal.z, 1)}</span>
          <span>חייב במס {formatPercent(taxableShare, 1)}</span>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
    </div>
  )
}
