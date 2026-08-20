import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearAuthError } from "../store/authSlice";
import { resolvePostLoginPath } from "../utils/format";
import AuthShell from "../components/AuthShell";
import Button from "../components/Button";
import Field from "../components/Field";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  async function handleSubmit(event) {
    event.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(result)) {
      navigate(resolvePostLoginPath(location.state?.from, "patient"), {
        replace: true,
      });
    }
  }

  return (
    <AuthShell
      eyebrow="Pendaftaran pasien"
      title="Rekam data pasien baru"
      description="Isi data diri untuk mendapatkan akun kunjungan. Akun dokter dan administrasi disiapkan rumah sakit."
      headline="Satu akun untuk seluruh kunjungan Anda."
      image="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1200&q=80"
      error={error}
      footer={
        <>
          Sudah punya akun?{" "}
          <Link
            to="/login"
            state={location.state?.from ? { from: location.state.from } : undefined}
            className="rounded-xs font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4 transition hover:text-bronze"
          >
            Masuk ke portal
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="Nama lengkap"
          hint="Sesuai kartu identitas untuk pencocokan rekam medis."
          required
        >
          {(props) => (
            <input
              {...props}
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          )}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" required>
            {(props) => (
              <input
                {...props}
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            )}
          </Field>
          <Field label="Nomor telepon" required>
            {(props) => (
              <input
                {...props}
                autoComplete="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            )}
          </Field>
        </div>
        <Field label="Password" hint="Minimal 6 karakter." required>
          {(props) => (
            <input
              {...props}
              type="password"
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}
        </Field>
        <Button
          type="submit"
          size="lg"
          loading={status === "loading"}
          className="w-full"
        >
          {status === "loading" ? "Menyimpan..." : "Daftar"}
        </Button>
      </form>
    </AuthShell>
  );
}
