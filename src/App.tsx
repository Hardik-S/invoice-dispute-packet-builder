import { buildDisputePacket, formatCurrency } from "./dispute";
import { disputeFixture } from "./fixtures";

const packet = buildDisputePacket(disputeFixture);

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="meta">Synthetic AP evidence workbench</p>
          <h1>Invoice Dispute Packet Builder</h1>
          <p className="lede">
            Match an invoice against the PO, receiving log, and email trail before sending a vendor-facing dispute.
          </p>
        </div>
        <div className="summary-panel" aria-label="Dispute summary">
          <span>Disputed total</span>
          <strong>{formatCurrency(packet.disputedTotal)}</strong>
          <small>{disputeFixture.vendor} / {disputeFixture.invoiceId}</small>
        </div>
      </section>

      <section className="grid three">
        <article className="panel">
          <span className="label">Invoice</span>
          <h2>{disputeFixture.invoiceId}</h2>
          <p>Total billed: {formatCurrency(packet.invoiceTotal)}</p>
          <p>Due: {disputeFixture.dueDate}</p>
        </article>
        <article className="panel">
          <span className="label">Purchase order</span>
          <h2>{disputeFixture.purchaseOrderId}</h2>
          <p>Expected total: {formatCurrency(packet.expectedTotal)}</p>
          <p>Owner: {disputeFixture.owner}</p>
        </article>
        <article className="panel">
          <span className="label">Delivery proof</span>
          <h2>{disputeFixture.deliveryProof.shipmentId}</h2>
          <p>Received by {disputeFixture.deliveryProof.receivedBy}</p>
          <p>{disputeFixture.deliveryProof.exceptionNote}</p>
        </article>
      </section>

      <section className="workspace">
        <div>
          <h2>Variance rationale</h2>
          <div className="variance-list">
            {packet.variances.map((variance) => (
              <article className="variance-card" key={variance.sku}>
                <div className="variance-head">
                  <div>
                    <span className={`severity ${variance.severity}`}>{variance.severity}</span>
                    <h3>{variance.label}</h3>
                  </div>
                  <strong>{formatCurrency(variance.delta)}</strong>
                </div>
                <p>{variance.rationale}</p>
                <ul>
                  {variance.evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <aside className="memo">
          <h2>Email-safe dispute memo</h2>
          <pre>{packet.memo}</pre>
        </aside>
      </section>
    </main>
  );
}

export default App;
