import { describe, expect, it } from "vitest";
import { buildDisputePacket, buildMemo, formatCurrency, lineTotal } from "./dispute";
import { disputeFixture } from "./fixtures";

describe("invoice dispute packet", () => {
  it("calculates invoice line totals", () => {
    expect(lineTotal({ quantity: 42, unitPrice: 128 })).toBe(5376);
  });

  it("keeps decimal unit price math rounded to currency cents", () => {
    expect(lineTotal({ quantity: 3, unitPrice: 0.1 })).toBe(0.3);
  });

  it("flags quantity, unit price, and unauthorized freight variance", () => {
    const packet = buildDisputePacket(disputeFixture);

    expect(packet.disputedTotal).toBe(1216);
    expect(packet.variances).toHaveLength(2);
    expect(packet.variances.map((variance) => variance.sku)).toEqual(["LAB-KIT-40", "RUSH-FRT"]);
    expect(packet.variances[0].rationale).toContain("quantity billed as 42 vs approved 40");
    expect(packet.variances[0].rationale).toContain(formatCurrency(128));
  });

  it("classifies small positive disputes as low severity", () => {
    const packet = buildDisputePacket({
      ...disputeFixture,
      invoiceLines: [
        {
          sku: "TEMP-PROBE",
          description: "Temperature probe",
          quantity: 1,
          unitPrice: 84
        }
      ],
      purchaseOrderLines: [
        {
          sku: "TEMP-PROBE",
          description: "Temperature probe",
          quantity: 1,
          unitPrice: 60,
          approvedQuantity: 1,
          approvedUnitPrice: 60
        }
      ],
      deliveryProof: {
        ...disputeFixture.deliveryProof,
        acceptedSkus: [{ sku: "TEMP-PROBE", quantity: 1 }]
      }
    });

    expect(packet.disputedTotal).toBe(24);
    expect(packet.variances[0].severity).toBe("low");
  });

  it("builds an email-safe memo with source-specific rationale", () => {
    const packet = buildDisputePacket(disputeFixture);

    expect(packet.memo).toContain("Subject: Dispute packet for INV-10482");
    expect(packet.memo).toContain("holding $1,216.00");
    expect(packet.memo).toContain("Rush freight surcharge");
    expect(packet.variances[1].evidence.join(" ")).toContain("do not approve rush freight");
  });

  it("matches email evidence when the subject carries the source cue", () => {
    const packet = buildDisputePacket({
      ...disputeFixture,
      emailNotes: [
        {
          from: "ap-review@example.invalid",
          sentAt: "2026-05-03 10:15",
          subject: "TEMP-PROBE receiving exception",
          excerpt: "The receiving log confirms only one unit was accepted."
        }
      ],
      invoiceLines: [
        {
          sku: "TEMP-PROBE",
          description: "Temperature probe",
          quantity: 2,
          unitPrice: 86
        }
      ],
      purchaseOrderLines: [
        {
          sku: "TEMP-PROBE",
          description: "Temperature probe",
          quantity: 1,
          unitPrice: 86,
          approvedQuantity: 1,
          approvedUnitPrice: 86
        }
      ],
      deliveryProof: {
        ...disputeFixture.deliveryProof,
        acceptedSkus: [{ sku: "TEMP-PROBE", quantity: 1 }]
      }
    });

    expect(packet.variances[0].evidence.join(" ")).toContain("TEMP-PROBE receiving exception");
  });

  it("matches invoice, purchase order, and delivery rows with padded SKU fields", () => {
    const packet = buildDisputePacket({
      ...disputeFixture,
      invoiceLines: [
        {
          sku: " LAB-KIT-40 ",
          description: "Field sampling kit",
          quantity: 42,
          unitPrice: 128
        }
      ],
      purchaseOrderLines: [
        {
          sku: "LAB-KIT-40",
          description: "Field sampling kit",
          quantity: 40,
          unitPrice: 120,
          approvedQuantity: 40,
          approvedUnitPrice: 120
        }
      ],
      deliveryProof: {
        ...disputeFixture.deliveryProof,
        acceptedSkus: [{ sku: "LAB-KIT-40", quantity: 40 }]
      }
    });

    expect(packet.disputedTotal).toBe(576);
    expect(packet.variances[0].sku).toBe("LAB-KIT-40");
    expect(packet.variances[0].rationale).toContain("quantity billed as 42 vs approved 40");
    expect(packet.variances[0].rationale).toContain("unit price billed at $128.00 vs approved $120.00");
  });

  it("makes no-dispute memos explicit when no positive variances are found", () => {
    const memo = buildMemo("Aster Supply Co.", "INV-00001", 0, []);

    expect(memo).toContain("No positive invoice variances were found for review.");
    expect(memo).toContain("No vendor-facing dispute action is recommended from this packet.");
    expect(memo).not.toContain("holding $0.00");
  });
});
