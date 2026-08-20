import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { http } from "../api/http";
import {
  canPayInvoice,
  formatDateId,
  formatFee,
  getErrorMessage,
  invoiceLabel,
  sessionLabel,
} from "../utils/format";
import { HOSPITAL } from "../data/hospital";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Letterhead from "../components/Letterhead";
import Alert from "../components/Alert";
import Skeleton from "../components/Skeleton";
import Avatar from "../components/Avatar";
import LinkButton from "../components/LinkButton";
import { IconReceipt } from "../components/Icons";

const FILTERS = [
  { id: "", label: "Semua" },
  { id: "unpaid", label: "Belum bayar" },
  { id: "pending", label: "Menunggu pembayaran" },
  { id: "paid", label: "Lunas" },
  { id: "expire", label: "Kedaluwarsa" },
  { id: "failed", label: "Gagal" },
];

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

function InvoiceList() {
  const [params, setParams] = useSearchParams();
  const status = FILTERS.some((item) => item.id && item.id === params.get("status"))
    ? params.get("status")
    : "";
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    http
      .get("/invoices")
      .then(({ data }) => {
        if (cancelled) return;
        setItems(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setItems([]);
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(
    () => (status ? items.filter((item) => item.status === status) : items),
    [items, status]
  );

  function setStatus(next) {
    const query = new URLSearchParams(params);
    if (next) query.set("status", next);
    else query.delete("status");
    setParams(query, { replace: true });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Kasir"
        title="Tagihan kunjungan"
        description="Semua kwitansi setelah konsultasi selesai. Bayar dari gerai digital rumah sakit."
      />

      <div
        className="mb-6 flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="Filter status tagihan"
      >
        {FILTERS.map((item) => {
          const active = item.id === status;
          return (
            <button
              key={item.id || "all"}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatus(item.id)}
              className={`rounded-sm px-3 py-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] transition duration-200 ease-soft ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "border border-line bg-white text-primary shadow-xs hover:border-gold/60 hover:text-bronze"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {error ? <Alert className="mb-6">{error}</Alert> : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={IconReceipt}
          title={items.length === 0 ? "Belum ada tagihan" : "Tidak ada tagihan pada filter ini"}
          hint={
            items.length === 0
              ? "Tagihan terbit setelah dokter menyelesaikan konsultasi."
              : "Pilih status lain, atau tampilkan semua tagihan."
          }
        />
      ) : (
        <div className="space-y-4">
          {visible.map((item, index) => (
            <article
              key={item.id}
              className="mf-card mf-rise p-5 sm:p-6"
              style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <Avatar
                    src={item.doctor?.imgUrl}
                    name={item.doctor?.name}
                    size="lg"
                    className="hidden sm:inline-flex"
                  />
                  <div className="min-w-0">
                    <p className="mf-kicker">Tagihan #{item.id}</p>
                    <h2 className="mt-1.5 font-display text-2xl font-medium leading-tight text-primary">
                      {item.doctor?.name || "Dokter"}
                    </h2>
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                      {item.doctor?.specialty?.name ? (
                        <span>{item.doctor.specialty.name}</span>
                      ) : null}
                      {item.date ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{formatDateId(item.date)}</span>
                        </>
                      ) : null}
                      {item.session ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Sesi {sessionLabel(item.session)}</span>
                        </>
                      ) : null}
                    </p>
                    <p className="tabular mt-3 font-display text-3xl font-medium text-primary">
                      {formatFee(item.amount)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <StatusBadge kind="invoice" status={item.status} />
                  <LinkButton to={`/tagihan/${item.id}`} size="sm">
                    {canPayInvoice(item.status) ? "Bayar" : "Lihat"}
                  </LinkButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceDetail({ invoiceId }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
    let cancelled = false;
    http
      .get(`/invoices/${invoiceId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setInvoice(data);
        setError("");
        setLoading(false);
        if (params.get("order_id") || params.get("transaction_status")) {
          navigate(`/tagihan/${invoiceId}`, { replace: true });
        }
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
  }, [invoiceId, params, navigate]);

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
      if (err.response?.status === 409) {
        await loadInvoice(invoice.id);
        return;
      }
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        eyebrow="Kasir"
        title="Kwitansi kunjungan"
        description="Rincian biaya konsultasi dan obat. Pembayaran melalui gerai digital rumah sakit."
      >
        <LinkButton to="/tagihan" variant="ghost">
          Semua tagihan
        </LinkButton>
      </PageHeader>

      {error ? <Alert className="mb-6">{error}</Alert> : null}

      {loading ? (
        <div className="mf-card space-y-4 p-6 md:p-8">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-14 w-56" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-11 w-full" />
        </div>
      ) : invoice ? (
        <article className="mf-card mf-rise p-6 shadow-md md:p-8">
          <Letterhead compact />

          <div className="mt-7 flex items-start justify-between gap-4">
            <div>
              <p className="mf-kicker">Tagihan #{invoice.id}</p>
              <p className="tabular mt-2 font-display text-4xl font-medium text-primary">
                {formatFee(invoice.amount)}
              </p>
              {invoice.doctor?.name ? (
                <p className="mt-2 text-sm text-muted">
                  {invoice.doctor.name}
                  {invoice.date ? ` · ${formatDateId(invoice.date)}` : ""}
                </p>
              ) : null}
            </div>
            <StatusBadge kind="invoice" status={invoice.status} />
          </div>

          <dl className="mf-card-quiet mt-7 divide-y divide-hairline px-4 text-sm">
            <div className="flex items-baseline justify-between gap-4 py-3.5">
              <dt className="text-muted">Biaya konsultasi</dt>
              <dd className="tabular font-semibold text-ink">
                {formatFee(invoice.consultationFee)}
              </dd>
            </div>
            {(invoice.items || []).map((item) => (
              <div
                key={item.id || `${item.medicineId}-${item.dosage}`}
                className="flex items-center justify-between gap-4 py-3"
              >
                <dt className="flex min-w-0 items-center gap-3 text-muted">
                  {item.imgUrl ? (
                    <img
                      src={item.imgUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-sm object-cover ring-1 ring-primary/10"
                    />
                  ) : null}
                  <span className="min-w-0">
                    {item.name || "Obat"} × {item.quantity}
                    {item.dosage ? ` · ${item.dosage}` : ""}
                  </span>
                </dt>
                <dd className="tabular shrink-0 font-semibold text-ink">
                  {formatFee(item.subtotal)}
                </dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-primary">
                Total
              </dt>
              <dd className="tabular font-display text-2xl font-medium text-primary">
                {formatFee(invoice.amount)}
              </dd>
            </div>
          </dl>

          {invoice.consultation?.diagnosis ? (
            <p className="mt-5 rounded-sm border-l-2 border-l-gold bg-gold-soft/45 px-4 py-3 text-sm leading-relaxed text-ink">
              <span className="font-semibold">Diagnosa:</span>{" "}
              {invoice.consultation.diagnosis}
            </p>
          ) : null}

          {canPayInvoice(invoice.status) ? (
            <Button size="lg" className="mt-7 w-full" onClick={handlePay}>
              Bayar di kasir digital
            </Button>
          ) : invoice.status === "paid" ? (
            <Alert tone="success" className="mt-6">
              Tagihan ini sudah lunas.
            </Alert>
          ) : (
            <Alert tone="info" className="mt-6">
              Status pembayaran: {invoiceLabel(invoice.status)}
            </Alert>
          )}

          <p className="mt-7 border-t border-hairline pt-4 text-[11px] text-muted">
            {HOSPITAL.legalName} · {HOSPITAL.accreditation}
          </p>
        </article>
      ) : (
        <EmptyState
          icon={IconReceipt}
          title="Tagihan tidak ditemukan"
          hint="Kembali ke daftar untuk melihat kwitansi yang tersedia."
        >
          <LinkButton to="/tagihan">Semua tagihan</LinkButton>
        </EmptyState>
      )}
    </div>
  );
}

export default function InvoicePage() {
  const { id } = useParams();
  if (id) return <InvoiceDetail invoiceId={id} />;
  return <InvoiceList />;
}
