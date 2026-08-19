import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { http } from "../api/http";
import {
  canPayInvoice,
  formatFee,
  getErrorMessage,
} from "../utils/format";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";

function loadSnap(clientKey) {
  return new Promise((resolve, reject) => {
    if (window.snap) {
      resolve(window.snap);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve(window.snap);
    script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap"));
    document.body.appendChild(script);
  });
}

export default function InvoicePage() {
  const { id: paramId } = useParams();
  const [params] = useSearchParams();
  const [invoiceId, setInvoiceId] = useState(paramId || params.get("id") || "");
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadInvoice(id) {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await http.get(`/invoices/${id}`);
      setInvoice(data);
    } catch (err) {
      setInvoice(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const startId = paramId || params.get("id");
    if (!startId) return undefined;
    let cancelled = false;
    http
      .get(`/invoices/${startId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setInvoice(data);
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setInvoice(null);
        setError(getErrorMessage(err));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paramId, params]);

  async function handlePay() {
    try {
      const { data } = await http.post(`/invoices/${invoice.id}/pay`);
      const snap = await loadSnap(data.clientKey);
      snap.pay(data.snapToken, {
        onSuccess: () => loadInvoice(invoice.id),
        onPending: () => loadInvoice(invoice.id),
        onError: () => loadInvoice(invoice.id),
        onClose: () => loadInvoice(invoice.id),
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        eyebrow="Pembayaran"
        title="Tagihan kunjungan"
        description="Tagihan dibuat setelah dokter menyelesaikan konsultasi. Jika belum ada invoice, halaman ini akan kosong."
      />
      <form
        className="mb-6 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          loadInvoice(invoiceId);
        }}
      >
        <label className="sr-only" htmlFor="invoice-id">ID tagihan</label>
        <input
          id="invoice-id"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          placeholder="ID tagihan"
          className="mf-input mt-0 flex-1"
        />
        <Button type="submit" variant="pine">
          Cek
        </Button>
      </form>
      {error ? <p className="mb-4 text-sm font-semibold text-danger">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-muted">Memuat tagihan...</p>
      ) : invoice ? (
        <article className="mf-card p-6 md:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Tagihan #{invoice.id}</p>
              <p className="tabular mt-1 font-display text-4xl font-medium text-ink">
                {formatFee(invoice.amount)}
              </p>
            </div>
            <StatusBadge kind="invoice" status={invoice.status} />
          </div>
          {invoice.doctor?.name ? (
            <p className="mt-2 text-sm text-muted">
              {invoice.doctor.name}
              {invoice.date ? ` · ${invoice.date}` : ""}
            </p>
          ) : null}
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Biaya konsul</dt>
              <dd className="font-semibold">{formatFee(invoice.consultationFee)}</dd>
            </div>
            {(invoice.items || []).map((item) => (
              <div key={item.id || `${item.medicineId}-${item.dosage}`} className="flex items-center justify-between gap-4">
                <dt className="flex min-w-0 items-center gap-3 text-muted">
                  {item.imgUrl ? (
                    <img
                      src={item.imgUrl}
                      alt={item.name || "Obat"}
                      className="h-10 w-10 shrink-0 rounded-xl object-cover"
                    />
                  ) : null}
                  <span>
                    {item.name || "Obat"} × {item.quantity}
                    {item.dosage ? ` · ${item.dosage}` : ""}
                  </span>
                </dt>
                <dd className="font-semibold">{formatFee(item.subtotal)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-line pt-2">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold">{formatFee(invoice.amount)}</dd>
            </div>
          </dl>
          {invoice.consultation?.diagnosis ? (
            <p className="mt-4 text-sm text-muted">Diagnosa: {invoice.consultation.diagnosis}</p>
          ) : null}
          {canPayInvoice(invoice.status) ? (
            <Button className="mt-6 w-full" onClick={handlePay}>
              Bayar dengan Snap
            </Button>
          ) : invoice.status === "paid" ? (
            <p className="mt-4 text-sm text-moss">Tagihan ini sudah lunas.</p>
          ) : (
            <p className="mt-4 text-sm text-muted">Status pembayaran: {invoice.status}</p>
          )}
        </article>
      ) : (
        <EmptyState
          title="Belum ada tagihan"
          hint="Selesaikan konsultasi dulu, atau masukkan ID tagihan jika sudah terbit."
        />
      )}
    </div>
  );
}
