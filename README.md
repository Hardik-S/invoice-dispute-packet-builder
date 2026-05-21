# Invoice Dispute Packet Builder

Invoice Dispute Packet Builder is a fixture-first finance operations demo that matches a synthetic invoice against a purchase order, delivery proof, and email notes. It turns scattered dispute evidence into variance rationale and an email-safe memo a finance analyst could send for review.

## Portfolio Signal

The product demonstrates evidence assembly, commercial judgment, and careful data-boundary handling. It is intentionally not an accounting system, payment system, legal tool, or automated collections workflow. The value is in making a dispute review packet inspectable before anyone sends a vendor-facing message.

## Synthetic Data Boundary

All invoice, PO, vendor, delivery, and email data in this repository is synthetic. No real finance records, vendor contracts, bank information, personal data, API keys, or confidential business logic are included.

## Stack Rationale

- Vite + React + TypeScript keeps the first slice fast, static, and easy to deploy on Vercel.
- Typed fixtures make provenance and review boundaries visible.
- Deterministic dispute logic is covered with Vitest before any future GPT or server-side behavior is considered.
- Plain CSS keeps the surface portable for later fixer passes without adding a component framework.

## File Map

- `src/fixtures.ts`: synthetic invoice, PO, delivery proof, and email-note data.
- `src/dispute.ts`: variance classification, evidence matching, and memo generation logic.
- `src/dispute.test.ts`: deterministic checks for totals, evidence, and memo content.
- `src/App.tsx`: single-screen product workflow composed from the dispute packet.
- `src/styles.css`: responsive workbench styling.

## Local Setup

```powershell
npm ci
npm run test -- --run
npm run build
npm run preview
```

## Decision Log

- The first slice uses one carefully explained dispute instead of a broad invoice dashboard because the queue acceptance criteria prioritize a packet, variance rationale, source evidence, and memo output.
- The memo is generated from deterministic fixture logic so the public demo can be verified without API keys or hidden model behavior.
- The UI separates invoice facts, source evidence, and suggested email copy so a reviewer can inspect where each claim came from.
- Monetary calculations are rounded to cents at each dispute boundary so decimal unit prices cannot leak JavaScript floating-point tails into packet totals.
- Empty dispute packets use an explicit no-action memo so a reviewer does not receive a blank bullet section or a misleading zero-dollar hold instruction.
- Severity thresholds are explicit: disputes below $100 stay low priority, disputes from $100 to $599.99 are medium, and disputes at $600 or more are high. This keeps nuisance variances visible without overstating their review priority.
- Email evidence matching searches both subject and excerpt text because forwarding chains often carry the SKU or exception cue in the subject while the excerpt holds only the operational detail.
- SKU matching trims and uppercases invoice, purchase-order, and delivery rows before comparison. This mirrors pasted AP exports where cell padding should not turn an approved line into a false full-balance dispute.
- Blank invoice SKU rows are ignored before totals and variance checks. Export spacer rows should not become vendor-facing dispute lines or inflate the held amount.
- Invoice lines are summed across duplicate normalized SKU rows before variance checks. Split invoice exports should still compare the total billed quantity and amount against the approved PO and receiving evidence.
- Receiving quantities are summed across duplicate normalized SKU rows before rationale generation. Split export rows should not create a false "no receiving proof" claim when the combined receiving evidence supports the billed quantity.
- Purchase-order approvals are summed across duplicate normalized SKU rows before variance checks. Split PO exports should not turn two valid approvals into a false overbilling dispute just because the first matching row is partial.
- The app remains public because all data is synthetic and no sensitive finance systems are connected.

## Limitations

- The tool does not provide legal, accounting, or payment advice.
- It does not connect to ERP, AP, procurement, email, or document-management systems.
- Currency, tax, and freight assumptions are simplified to make the evidence trail auditable in the first portfolio slice.
