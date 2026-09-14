import { formatILS } from '../calc/format.ts'

type Props = {
  deltaReal: number
}

export function GapBanner({ deltaReal }: Props) {
  const abs = Math.abs(deltaReal)
  const tie = abs < 0.5
  const fundWins = deltaReal > 0
  const tone = tie ? 'tie' : fundWins ? 'fund' : 'market'

  let headline: string
  if (tie) {
    headline = 'המסלולים כמעט זהים בשווי ריאלי ליום הפרישה'
  } else if (fundWins) {
    headline = 'מסלול הקופה עדיף בשווי ריאלי ליום הפרישה'
  } else {
    headline = 'מסלול השוק עדיף בשווי ריאלי ליום הפרישה'
  }

  return (
    <section className={`gap gap--${tone}`} aria-live="polite">
      <p className="gap__kicker">השוואה בשווי ריאלי ביום הפרישה</p>
      <h2>{headline}</h2>
      <p className="gap__amount">{tie ? formatILS(0) : formatILS(abs)}</p>
      <p className="gap__hint">פער = ריאלי קופה − ריאלי שוק</p>
    </section>
  )
}
