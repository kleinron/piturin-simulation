import type { ReactNode } from 'react'
import { formatILS } from '../calc/format.ts'
import type { DismissalBreakdown, Path1Result, Path2Result } from '../calc/piturin.ts'
import { RateSlider } from './RateSlider.tsx'

type SharedProps = {
  children: ReactNode
}

function PathShell({
  tone,
  kicker,
  title,
  blurb,
  real,
  nominal,
  children,
}: SharedProps & {
  tone: 'fund' | 'market'
  kicker: string
  title: string
  blurb: string
  real: number
  nominal: number
}) {
  return (
    <article className={`path path--${tone}`}>
      <header>
        <p className="path__kicker">{kicker}</p>
        <h2>{title}</h2>
        <p className="path__blurb">{blurb}</p>
      </header>
      <div className="path__hero">
        <p className="path__metric-label">שווי ריאלי ביום הפרישה</p>
        <p className="path__real">{formatILS(real)}</p>
        <p className="path__nominal">נומינלי: {formatILS(nominal)}</p>
      </div>
      {children}
    </article>
  )
}

type Path1Props = {
  result: Path1Result
  r: number
  onChangeR: (value: number) => void
}

export function Path1Card({ result, r, onChangeR }: Path1Props) {
  return (
    <PathShell
      tone="fund"
      kicker="מסלול 1"
      title="השארה בקופה"
      blurb="מסלול מועדף: אין מס בפיטורים ואין מס בפרישה. כל היתרה נטו ביד."
      real={result.real}
      nominal={result.nominal}
    >
      <RateSlider
        id="rate-r"
        label="תשואה שנתית בקופה (r)"
        hint="סליידר עצמאי — התוצאה מתעדכנת מיד."
        minPct={3}
        maxPct={7}
        stepPct={0.5}
        value={r}
        onChange={onChangeR}
        tone="fund"
      />
    </PathShell>
  )
}

type Path2Props = {
  result: Path2Result
  dismissal: DismissalBreakdown
  p: number
  onChangeP: (value: number) => void
}

export function Path2Card({ result, dismissal, p, onChangeP }: Path2Props) {
  return (
    <PathShell
      tone="market"
      kicker="מסלול 2"
      title="משיכה, מס והשקעה בשוק"
      blurb="משלמים מס שולי על החלק החייב היום, משקיעים את הנטו, ובפרישה 25% מס על הרווח הריאלי."
      real={result.real}
      nominal={result.nominalNet}
    >
      <RateSlider
        id="rate-p"
        label="תשואה שנתית בתיק (p)"
        hint="סליידר עצמאי — התוצאה מתעדכנת מיד."
        minPct={5.5}
        maxPct={9}
        stepPct={0.5}
        value={p}
        onChange={onChangeP}
        tone="market"
      />
      <dl className="breakdown">
        <div>
          <dt>סכום פטור</dt>
          <dd>{formatILS(dismissal.exemptAmount)}</dd>
        </div>
        <div>
          <dt>חייב במס בפיטורים</dt>
          <dd>{formatILS(dismissal.taxableOnDismissal)}</dd>
        </div>
        <div>
          <dt>מס פיטורים</dt>
          <dd>{formatILS(dismissal.dismissalTax)}</dd>
        </div>
        <div>
          <dt>נטו מושקע</dt>
          <dd>{formatILS(dismissal.netInvested)}</dd>
        </div>
        <div>
          <dt>מס רווח הון ריאלי (25%)</dt>
          <dd>{formatILS(result.cgt)}</dd>
        </div>
      </dl>
    </PathShell>
  )
}
