# סימולציית פיצויי פיטורין

MVP בעברית (RTL) להשוואת שני מסלולי פיצויי פיטורין בישראל, במסך אחד. המדד העיקרי הוא **שווי ריאלי בשקלים ביום הפרישה**.

- **מסלול 1 — קופה (מועדף):** אין מס בפיטורים ואין מס בפרישה. `x` צומח בתשואת הקופה `r`.
- **מסלול 2 — משיכה → מס → שוק:** משלמים מס שולי על החלק החייב, משקיעים את הנטו בתשואה `p`, ובפרישה 25% מס רווח הון על הרווח הריאלי.

`x` הוא **יתרת הפיצויים שהופקדה בקופה** (קלט משתמש), לא ותק × משכורת. המודל אינו כולל דמי ניהול.

## הרצה מקומית

דורש Node.js 20+. בסיס Vite מוגדר ל־`/piturin-simulation/` (ל־GitHub Pages), ולכן הכתובת המקומית כוללת את הנתיב הזה.

```bash
npm install
npm run dev
```

פתחו את [http://localhost:5173/piturin-simulation/](http://localhost:5173/piturin-simulation/).

פקודות נוספות:

```bash
npm test          # בדיקות יחידה (Vitest)
npm run build     # בניית production ל־dist/
npm run preview   # תצוגה מקדימה של ה־build (גם כן תחת /piturin-simulation/)
```

## GitHub Pages

האפליקציה נבנית עם `base: '/piturin-simulation/'`. אחרי מיזוג ל־`main`, הפעילו Pages על **GitHub Actions** (Settings → Pages → Source). ה־workflow ב־`.github/workflows/pages.yml` מריץ בדיקות, בונה, ומפרסם את `dist/`.

הכתובת הצפויה: `https://<user>.github.io/piturin-simulation/`.

## נוסחאות (MVP)

- `tenureYears = years + months / 12`
- `exemptAmount = min(x, y × 1.5 × tenureYears, ceiling × tenureYears)` (תקרה ברירת מחדל: 13,750 לשנת 2026)
- `z = clamp(exemptAmount / x, 0, 1)` (אם `x = 0` אז `z = 0`)
- `taxableOnDismissal = max(0, x − exemptAmount)`
- `dismissalTax = tax(income + taxable) − tax(income)` לפי מדרגות 2026, בלי נקודות זיכוי
- `netInvested = x − dismissalTax`
- `n = max(0, retirementAge − currentAge)`

**מסלול 1:** `nominal1 = x × (1+r)^n`, `real1 = nominal1 / (1+i)^n`

**מסלול 2:** `nominal2Gross = netInvested × (1+p)^n`; בסיס = `netInvested × (1+i)^n`; מס רווח הון 25% על `max(0, nominal2Gross − basis)`; `real2` מהנטו אחרי המס, מהוון באינפלציה.

מדרגות מס שנתיות 2026: 84,120→10%, 120,720→14%, 228,000→20%, 301,200→31%, 560,280→35%, 721,560→47%, ומעליהן 50% (47+3).

הסימולציה היא כלי עזר בלבד ואינה ייעוץ מס או השקעות.
