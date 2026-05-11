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
- The app remains public because all data is synthetic and no sensitive finance systems are connected.

## Limitations

- The tool does not provide legal, accounting, or payment advice.
- It does not connect to ERP, AP, procurement, email, or document-management systems.
- Currency, tax, and freight assumptions are simplified to make the evidence trail auditable in the first portfolio slice.
