export type InvoiceLine = {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type PurchaseOrderLine = InvoiceLine & {
  approvedQuantity: number;
  approvedUnitPrice: number;
};

export type DeliveryProof = {
  shipmentId: string;
  deliveredOn: string;
  receivedBy: string;
  acceptedSkus: Array<{ sku: string; quantity: number }>;
  exceptionNote: string;
};

export type EmailNote = {
  from: string;
  sentAt: string;
  subject: string;
  excerpt: string;
};

export const disputeFixture = {
  vendor: "Aster Supply Co.",
  invoiceId: "INV-10482",
  invoiceDate: "2026-04-30",
  dueDate: "2026-05-21",
  purchaseOrderId: "PO-7721",
  owner: "Mina Patel, AP Coordinator",
  invoiceLines: [
    { sku: "LAB-KIT-40", description: "Field sampling kit", quantity: 42, unitPrice: 128 },
    { sku: "TEMP-PROBE", description: "Bluetooth temperature probe", quantity: 12, unitPrice: 86 },
    { sku: "RUSH-FRT", description: "Rush freight surcharge", quantity: 1, unitPrice: 640 }
  ] satisfies InvoiceLine[],
  purchaseOrderLines: [
    { sku: "LAB-KIT-40", description: "Field sampling kit", quantity: 40, unitPrice: 120, approvedQuantity: 40, approvedUnitPrice: 120 },
    { sku: "TEMP-PROBE", description: "Bluetooth temperature probe", quantity: 12, unitPrice: 86, approvedQuantity: 12, approvedUnitPrice: 86 },
    { sku: "RUSH-FRT", description: "Rush freight surcharge", quantity: 0, unitPrice: 0, approvedQuantity: 0, approvedUnitPrice: 0 }
  ] satisfies PurchaseOrderLine[],
  deliveryProof: {
    shipmentId: "SHIP-3388",
    deliveredOn: "2026-04-28",
    receivedBy: "R. Nguyen",
    acceptedSkus: [
      { sku: "LAB-KIT-40", quantity: 40 },
      { sku: "TEMP-PROBE", quantity: 12 }
    ],
    exceptionNote: "Receiving log accepted forty sampling kits; no rush freight authorization attached."
  } satisfies DeliveryProof,
  emailNotes: [
    {
      from: "ops-lead@example.invalid",
      sentAt: "2026-04-26 14:15",
      subject: "Re: Aster order timing",
      excerpt: "Please keep the original quantity. We can wait until Tuesday; do not approve rush freight without AP sign-off."
    },
    {
      from: "vendor-ar@example.invalid",
      sentAt: "2026-05-02 09:30",
      subject: "Invoice INV-10482",
      excerpt: "The invoice reflects expedited handling and the extra kits staged by our warehouse."
    }
  ] satisfies EmailNote[]
};
