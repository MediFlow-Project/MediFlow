import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearAuthError } from "../store/authSlice";
import { resolvePostLoginPath } from "../utils/format";
import { HOSPITAL } from "../data/hospital";
import AuthShell from "../components/AuthShell";
import Button from "../components/Button";
import Field from "../components/Field";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      navigate(
        resolvePostLoginPath(location.state?.from, result.payload.user.role),
        { replace: true }
      );
    }
  }

  return (
    <AuthShell
      eyebrow="Masuk"
      title="Portal rumah sakit"
      description="Pasien, dokter, dan staf administrasi memakai akun masing-masing. Hanya pasien yang dapat mendaftar sendiri."
      headline={`Selamat datang di ${HOSPITAL.name}.`}
      image="https://images.unsplash.com/photo-1519494140681-8b17d830a3e9?auto=format&fit=crop&w=1200&q=80"
      error={error}
      footer={
        <>
          Belum terdaftar sebagai pasien?{" "}
          <Link
            to="/register"
            state={location.state?.from ? { from: location.state.from } : undefined}
            className="rounded-xs font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4 transition hover:text-bronze"
          >
            Buat rekam pendaftaran
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
        <Field label="Password" required>
          {(props) => (
            <input
              {...props}
              type="password"
              autoComplete="current-password"
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
          {status === "loading" ? "Memeriksa..." : "Masuk"}
        </Button>
      </form>
    </AuthShell>
  );
}
