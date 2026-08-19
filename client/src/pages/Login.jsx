import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearAuthError } from "../store/authSlice";
import { homeForRole } from "../utils/format";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";

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
      const from = location.state?.from;
      navigate(from || homeForRole(result.payload.user.role), { replace: true });
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
      <aside className="relative hidden min-h-[28rem] overflow-hidden rounded-[1.75rem] lg:block">
        <img
          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/40 to-transparent" />
        <p className="absolute bottom-6 left-6 right-6 font-display text-3xl font-medium leading-snug text-white">
          Selamat datang kembali ke layanan RS MediFlow.
        </p>
      </aside>
      <div>
        <PageHeader
          eyebrow="Masuk"
          title="Masuk ke akun Anda"
          description="Dokter dan admin memakai akun yang disiapkan rumah sakit. Pasien bisa daftar sendiri."
        />
        <form onSubmit={handleSubmit} className="mf-card space-y-4 p-6 md:p-7">
          <label className="block text-sm font-semibold">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mf-input"
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mf-input"
            />
          </label>
          {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
          <Button type="submit" disabled={status === "loading"} className="w-full">
            {status === "loading" ? "Masuk..." : "Masuk"}
          </Button>
          <p className="text-center text-sm text-muted">
            Belum punya akun pasien?{" "}
            <Link to="/register" className="font-semibold text-primary">
              Daftar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
