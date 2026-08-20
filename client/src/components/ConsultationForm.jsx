import { useState } from "react";
import Button from "./Button";
import Field from "./Field";
import { IconCheck } from "./Icons";

const BLANK = {
  complaint: "",
  diagnosis: "",
  notes: "",
  medicineId: "",
  quantity: "1",
  dosage: "3x1 sesudah makan",
};

export default function ConsultationForm({
  queueNumber,
  patientName,
  medicines,
  busy,
  onSubmit,
}) {
  const [form, setForm] = useState(BLANK);

  const selectedMedicine = medicines.find(
    (item) => String(item.id) === String(form.medicineId)
  );

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const items = form.medicineId
      ? [
          {
            medicineId: Number(form.medicineId),
            quantity: Number(form.quantity),
            dosage: form.dosage,
          },
        ]
      : [];
    const ok = await onSubmit({
      complaint: form.complaint,
      diagnosis: form.diagnosis,
      notes: form.notes,
      items,
    });
    if (ok) setForm(BLANK);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mf-card mf-rise space-y-5 p-5 shadow-md md:p-7"
    >
      <header className="border-b border-hairline pb-4">
        <p className="mf-kicker">Ringkasan kunjungan</p>
        <h2 className="mt-2 font-display text-2xl font-medium text-primary">
          Nomor {String(queueNumber).padStart(2, "0")}
          {patientName ? (
            <span className="ml-2 text-base font-normal text-muted">
              {patientName}
            </span>
          ) : null}
        </h2>
      </header>

      <Field label="Keluhan" required>
        {(props) => (
          <textarea
            {...props}
            rows={2}
            className={`${props.className} resize-y`}
            value={form.complaint}
            onChange={(e) => update("complaint", e.target.value)}
          />
        )}
      </Field>

      <Field label="Diagnosa" required>
        {(props) => (
          <textarea
            {...props}
            rows={2}
            className={`${props.className} resize-y`}
            value={form.diagnosis}
            onChange={(e) => update("diagnosis", e.target.value)}
          />
        )}
      </Field>

      <Field label="Catatan" hint="Opsional, tampil di rekam kunjungan pasien.">
        {(props) => (
          <input
            {...props}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        )}
      </Field>

      <fieldset className="mf-card-quiet space-y-4 p-4">
        <legend className="mf-kicker px-1">Resep obat</legend>
        <div className="grid gap-4 sm:grid-cols-[1fr_6rem] lg:grid-cols-[1fr_6rem_1fr]">
          <Field label="Obat">
            {(props) => (
              <div className="mt-1.5 flex items-center gap-3">
                {selectedMedicine?.imgUrl ? (
                  <img
                    src={selectedMedicine.imgUrl}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-sm object-cover ring-1 ring-primary/10"
                  />
                ) : null}
                <select
                  {...props}
                  className={`${props.className} mt-0 flex-1`}
                  value={form.medicineId}
                  onChange={(e) => update("medicineId", e.target.value)}
                >
                  <option value="">Tanpa obat</option>
                  {medicines.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </Field>
          <Field label="Jumlah">
            {(props) => (
              <input
                {...props}
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => update("quantity", e.target.value)}
              />
            )}
          </Field>
          <Field label="Dosis" className="sm:col-span-2 lg:col-span-1">
            {(props) => (
              <input
                {...props}
                value={form.dosage}
                onChange={(e) => update("dosage", e.target.value)}
              />
            )}
          </Field>
        </div>
      </fieldset>

      <Button type="submit" size="lg" loading={busy} className="w-full sm:w-auto">
        <IconCheck className="h-3.5 w-3.5" />
        Selesai &amp; buat tagihan
      </Button>
    </form>
  );
}
