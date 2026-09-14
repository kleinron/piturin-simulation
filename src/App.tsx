import { useMemo, useState } from 'react'
import { defaultInputs } from './calc/defaults.ts'
import { simulate, type SimulationInputs } from './calc/piturin.ts'
import { ComputedStrip } from './components/ComputedStrip.tsx'
import { GapBanner } from './components/GapBanner.tsx'
import { FieldGroup, NumericField } from './components/NumericField.tsx'
import { Path1Card, Path2Card } from './components/PathCards.tsx'

type FormState = SimulationInputs & { incomeTouched: boolean }

const initialState: FormState = {
  ...defaultInputs,
  incomeTouched: false,
}

export default function App() {
  const [form, setForm] = useState<FormState>(initialState)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const result = useMemo(() => simulate(form), [form])

  function patch(partial: Partial<FormState>) {
    setForm((prev) => {
      const next = { ...prev, ...partial }
      if (!next.incomeTouched && partial.y !== undefined) {
        next.annualIncome = next.y * 12
      }
      return next
    })
  }

  return (
    <div className="page">
      <header className="masthead">
        <p className="masthead__kicker">סעיף 14 · פיצויי פיטורין</p>
        <h1>סימולציית פיצויי פיטורין</h1>
        <p className="masthead__lede">
          השוואה בשווי ריאלי ביום הפרישה בין השארת הפיצויים בקופה לבין משיכה היום, תשלום
          מס, והשקעה בשוק. יתרת הפיצויים (x) היא הסכום שהופקד בקופה — לא ותק × משכורת.
        </p>
      </header>

      <form
        className="inputs"
        onSubmit={(event) => event.preventDefault()}
        aria-label="נתוני הסימולציה"
      >
        <FieldGroup legend="יתרות ושכר">
          <NumericField
            id="input-x"
            label="יתרת פיצויים בקופה (x)"
            hint="הסכום המופקד בקופה כיום, לא חישוב ותק × משכורת."
            value={form.x}
            min={0}
            step={1000}
            suffix="₪"
            onChange={(x) => patch({ x })}
          />
          <NumericField
            id="input-y"
            label="משכורת ברוטו אחרונה, חודשית (y)"
            value={form.y}
            min={0}
            step={100}
            suffix="₪"
            onChange={(y) => patch({ y })}
          />
        </FieldGroup>

        <FieldGroup legend="ותק וגיל">
          <div className="split-fields">
            <NumericField
              id="input-tenure-years"
              label="ותק — שנים"
              value={form.tenureYearsWhole}
              min={0}
              max={60}
              step={1}
              onChange={(tenureYearsWhole) => patch({ tenureYearsWhole })}
            />
            <NumericField
              id="input-tenure-months"
              label="ותק — חודשים"
              value={form.tenureMonths}
              min={0}
              max={11}
              step={1}
              onChange={(tenureMonths) => patch({ tenureMonths })}
            />
          </div>
          <div className="split-fields">
            <NumericField
              id="input-current-age"
              label="גיל נוכחי"
              value={form.currentAge}
              min={16}
              max={90}
              step={1}
              onChange={(currentAge) => patch({ currentAge })}
            />
            <NumericField
              id="input-retirement-age"
              label="גיל פרישה"
              hint="ברירת מחדל: 67"
              value={form.retirementAge}
              min={40}
              max={90}
              step={1}
              onChange={(retirementAge) => patch({ retirementAge })}
            />
          </div>
        </FieldGroup>

        <FieldGroup legend="אינפלציה והכנסה למס">
          <NumericField
            id="input-inflation"
            label="אינפלציה שנתית משוערת (i)"
            hint="ברירת מחדל: 2.5%"
            value={form.inflation * 100}
            min={0}
            max={20}
            step={0.1}
            suffix="%"
            onChange={(pct) => patch({ inflation: pct / 100 })}
          />
          <NumericField
            id="input-income"
            label="הכנסה שנתית משוערת"
            hint={
              form.incomeTouched
                ? 'עודכן ידנית. ברירת המחדל היא משכורת × 12.'
                : 'ברירת מחדל: משכורת חודשית × 12. ניתן לערוך.'
            }
            value={form.annualIncome}
            min={0}
            step={1000}
            suffix="₪"
            onChange={(annualIncome) => patch({ annualIncome, incomeTouched: true })}
          />
        </FieldGroup>

        <div className="advanced">
          <button
            type="button"
            className="advanced__toggle"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced((open) => !open)}
          >
            {showAdvanced ? 'הסתר הגדרות מתקדמות' : 'הגדרות מתקדמות'}
          </button>
          {showAdvanced ? (
            <NumericField
              id="input-ceiling"
              label="תקרת פטור לשנת ותק"
              hint="ברירת מחדל לשנת 2026: 13,750 ₪. ניתן לערוך."
              value={form.exemptionCeilingPerYear}
              min={0}
              step={50}
              suffix="₪"
              onChange={(exemptionCeilingPerYear) => patch({ exemptionCeilingPerYear })}
            />
          ) : (
            <p className="advanced__summary">
              תקרת פטור לשנת ותק: {form.exemptionCeilingPerYear.toLocaleString('he-IL')} ₪
              (2026, לקריאה בלבד עד לפתיחת ההגדרות)
            </p>
          )}
        </div>
      </form>

      <ComputedStrip dismissal={result.dismissal} x={form.x} />
      <GapBanner deltaReal={result.deltaReal} />

      <div className="paths">
        <Path1Card result={result.path1} r={form.r} onChangeR={(r) => patch({ r })} />
        <Path2Card
          result={result.path2}
          dismissal={result.dismissal}
          p={form.p}
          onChangeP={(p) => patch({ p })}
        />
      </div>

      <p className="disclaimer">
        הסימולציה היא כלי עזר בלבד ואינה ייעוץ מס, פנסיוני או השקעות. המודל אינו כולל דמי
        ניהול. מדרגות המס הן לשנת 2026, ללא נקודות זיכוי. יש לאמת מול איש מקצוע.
      </p>
    </div>
  )
}
