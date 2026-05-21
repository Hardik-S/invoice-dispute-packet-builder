import { disputeFixture, type EmailNote, type InvoiceLine, type PurchaseOrderLine } from "./fixtures";

export type Variance = {
  sku: string;
  label: string;
  invoiceAmount: number;
  expectedAmount: number;
  delta: number;
  rationale: string;
  evidence: string[];
  severity: "low" | "medium" | "high";
};

export type DisputePacket = {
  invoiceTotal: number;
  expectedTotal: number;
  disputedTotal: number;
  variances: Variance[];
  memo: string;
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

type InvoiceLineSummary = Pick<InvoiceLine, "sku" | "description" | "quantity" | "unitPrice"> & {
  invoiceAmount: number;
};

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineTotal(line: Pick<InvoiceLine, "quantity" | "unitPrice">): number {
  return money(line.quantity * line.unitPrice);
}

function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase();
}

function summarizeInvoiceLines(invoiceLines: InvoiceLine[]): InvoiceLineSummary[] {
  const summaries = new Map<string, InvoiceLineSummary>();

  for (const line of invoiceLines) {
    const normalizedSku = normalizeSku(line.sku);
    if (!normalizedSku) {
      continue;
    }

    const existing = summaries.get(normalizedSku);

    if (!existing) {
      summaries.set(normalizedSku, {
        sku: normalizedSku,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        invoiceAmount: lineTotal(line)
      });
      continue;
    }

    existing.quantity += line.quantity;
    existing.invoiceAmount = money(existing.invoiceAmount + lineTotal(line));
    existing.unitPrice = existing.quantity === 0 ? 0 : money(existing.invoiceAmount / existing.quantity);
  }

  return [...summaries.values()];
}

function findPoSummary(sku: string, poLines: PurchaseOrderLine[]) {
  const normalizedSku = normalizeSku(sku);
  const matches = poLines.filter((line) => normalizeSku(line.sku) === normalizedSku);

  if (matches.length === 0) {
    return undefined;
  }

  const approvedQuantity = matches.reduce((sum, line) => sum + line.approvedQuantity, 0);
  const approvedAmount = money(matches.reduce(
    (sum, line) => sum + line.approvedQuantity * line.approvedUnitPrice,
    0
  ));
  const approvedUnitPrice = approvedQuantity === 0 ? 0 : money(approvedAmount / approvedQuantity);

  return { approvedQuantity, approvedUnitPrice, approvedAmount };
}

function findAcceptedQuantity(sku: string, acceptedSkus: Array<{ sku: string; quantity: number }>): number {
  const normalizedSku = normalizeSku(sku);
  return acceptedSkus
    .filter((entry) => normalizeSku(entry.sku) === normalizedSku)
    .reduce((sum, entry) => sum + entry.quantity, 0);
}

function findEmailEvidence(sku: string, notes: EmailNote[]) {
  const skuHints: Record<string, string[]> = {
    "LAB-KIT-40": ["original quantity", "extra kits"],
    "RUSH-FRT": ["rush freight", "expedited handling"],
    "TEMP-PROBE": ["temperature probe"]
  };

  const normalizedSku = normalizeSku(sku);
  const hints = [...(skuHints[normalizedSku] ?? []), normalizedSku];
  return notes
    .filter((note) => {
      const searchableNoteText = `${note.subject} ${note.excerpt}`.toLowerCase();
      return hints.some((hint) => searchableNoteText.includes(hint.toLowerCase()));
    })
    .map((note) => `${note.sentAt} ${note.subject}: ${note.excerpt}`);
}

function classifySeverity(delta: number): Variance["severity"] {
  if (delta >= 600) {
    return "high";
  }

  if (delta >= 100) {
    return "medium";
  }

  return "low";
}

export function buildDisputePacket(fixture = disputeFixture): DisputePacket {
  const invoiceLineSummaries = summarizeInvoiceLines(fixture.invoiceLines);
  const variances = invoiceLineSummaries.flatMap((invoiceLine) => {
    const normalizedSku = normalizeSku(invoiceLine.sku);
    const poSummary = findPoSummary(invoiceLine.sku, fixture.purchaseOrderLines);
    const acceptedQuantity = findAcceptedQuantity(invoiceLine.sku, fixture.deliveryProof.acceptedSkus);
    const expectedQuantity = poSummary?.approvedQuantity ?? acceptedQuantity;
    const expectedUnitPrice = poSummary?.approvedUnitPrice ?? 0;
    const invoiceAmount = invoiceLine.invoiceAmount;
    const expectedAmount = poSummary?.approvedAmount ?? money(expectedQuantity * expectedUnitPrice);
    const delta = money(invoiceAmount - expectedAmount);

    if (delta <= 0) {
      return [];
    }

    const quantityIssue = invoiceLine.quantity !== expectedQuantity;
    const priceIssue = invoiceLine.unitPrice !== expectedUnitPrice;
    const noReceipt = acceptedQuantity === 0 && invoiceLine.quantity > 0;
    const evidence = [
      `PO ${fixture.purchaseOrderId} approved ${expectedQuantity} units at ${currency.format(expectedUnitPrice)}.`,
      `Delivery ${fixture.deliveryProof.shipmentId} received ${acceptedQuantity} units on ${fixture.deliveryProof.deliveredOn}.`,
      fixture.deliveryProof.exceptionNote,
      ...findEmailEvidence(invoiceLine.sku, fixture.emailNotes)
    ];

    const rationaleParts = [
      quantityIssue ? `quantity billed as ${invoiceLine.quantity} vs approved ${expectedQuantity}` : "",
      priceIssue ? `unit price billed at ${currency.format(invoiceLine.unitPrice)} vs approved ${currency.format(expectedUnitPrice)}` : "",
      noReceipt ? "line has no receiving proof" : ""
    ].filter(Boolean);

    return [{
      sku: normalizedSku,
      label: invoiceLine.description,
      invoiceAmount,
      expectedAmount,
      delta,
      rationale: rationaleParts.join("; "),
      evidence,
      severity: classifySeverity(delta)
    } satisfies Variance];
  });

  const invoiceTotal = money(invoiceLineSummaries.reduce((sum, line) => sum + line.invoiceAmount, 0));
  const expectedTotal = money(invoiceTotal - variances.reduce((sum, item) => sum + item.delta, 0));
  const disputedTotal = money(invoiceTotal - expectedTotal);

  return {
    invoiceTotal,
    expectedTotal,
    disputedTotal,
    variances,
    memo: buildMemo(fixture.vendor, fixture.invoiceId, disputedTotal, variances)
  };
}

export function buildMemo(vendor: string, invoiceId: string, disputedTotal: number, variances: Variance[]): string {
  if (variances.length === 0) {
    return [
      `Subject: Dispute packet for ${invoiceId}`,
      "",
      `Hi ${vendor} team,`,
      "",
      "No positive invoice variances were found for review.",
      "No vendor-facing dispute action is recommended from this packet."
    ].join("\n");
  }

  const bullets = variances.map((variance) => `- ${variance.label}: dispute ${currency.format(variance.delta)} because ${variance.rationale}.`).join("\n");

  return [
    `Subject: Dispute packet for ${invoiceId}`,
    "",
    `Hi ${vendor} team,`,
    "",
    `We are holding ${currency.format(disputedTotal)} from ${invoiceId} pending support for the items below.`,
    bullets,
    "",
    "Please send corrected backup or a revised invoice that matches the purchase order and receiving log. We can release the undisputed amount while this is reviewed."
  ].join("\n");
}

export function formatCurrency(value: number): string {
  return currency.format(value);
}
