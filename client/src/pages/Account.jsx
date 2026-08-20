import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateMe, clearAuthError } from "../store/authSlice";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/format";
import PageHeader from "../components/PageHeader";
import Field from "../components/Field";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function Account() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");
  const missingPhone = !String(user?.phone || "").trim();
  const userSnapshot = `${user?.id ?? ""}:${user?.name ?? ""}:${user?.phone ?? ""}`;
  const [seenUser, setSeenUser] = useState(userSnapshot);
  if (seenUser !== userSnapshot) {
    setSeenUser(userSnapshot);
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      password: "",
    });
  }

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  async function handleSubmit(event) {
    event.preventDefault();
    dispatch(clearAuthError());
    setLocalError("");
    const phone = form.phone.trim();
    if (!phone) {
      setLocalError("Nomor HP wajib diisi agar rekam kunjungan dapat dihubungi.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      phone,
    };
    if (form.password) payload.password = form.password;
    const result = await dispatch(updateMe(payload));
    setSaving(false);
    if (updateMe.fulfilled.match(result)) {
      setForm((current) => ({ ...current, password: "" }));
      showToast({ type: "success", message: "Profil disimpan." });
    } else {
      setLocalError(result.payload || getErrorMessage(result));
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        eyebrow="Akun"
        title="Data diri"
        description="Nama dan nomor HP dipakai di rekam kunjungan. Email dan peran tidak dapat diubah dari sini."
      />
      {missingPhone ? (
        <Alert tone="warning" className="mb-6" title="Lengkapi nomor HP">
          Akun masuk lewat Google belum punya nomor telepon. Isi HP agar rumah
          sakit dapat menghubungi Anda terkait kunjungan.
        </Alert>
      ) : null}
      {localError || error ? (
        <Alert className="mb-6">{localError || error}</Alert>
      ) : null}
      <form onSubmit={handleSubmit} className="mf-card space-y-5 p-5 sm:p-6">
        <Field label="Nama lengkap" required>
          {(props) => (
            <input
              {...props}
              autoComplete="name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          )}
        </Field>
        <Field
          label="Nomor telepon"
          required
          hint={
            missingPhone
              ? "Wajib diisi setelah masuk dengan Google."
              : undefined
          }
        >
          {(props) => (
            <input
              {...props}
              autoComplete="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
          )}
        </Field>
        <Field label="Email" hint="Tidak dapat diubah.">
          {(props) => (
            <input {...props} type="email" value={user?.email || ""} disabled />
          )}
        </Field>
        <Field
          label="Password baru"
          hint="Kosongkan jika tidak ingin mengganti. Minimal 6 karakter."
        >
          {(props) => (
            <input
              {...props}
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
          )}
        </Field>
        <p className="text-sm text-muted">
          Peran: {user?.role || "—"}
        </p>
        <Button type="submit" loading={saving} disabled={!form.name.trim() || !form.phone.trim()}>
          Simpan
        </Button>
      </form>
    </div>
  );
}
