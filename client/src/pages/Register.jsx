import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearAuthError } from "../store/authSlice";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
      navigate("/saya", { replace: true });
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        eyebrow="Pendaftaran pasien"
        title="Buat akun MediFlow"
        description="Hanya pasien yang bisa mendaftar. Akun dokter dan admin disiapkan rumah sakit."
      />
      <form onSubmit={handleSubmit} className="mf-card space-y-4 p-6 md:p-7">
        <label className="block text-sm font-semibold">
          Nama lengkap
          <input
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mf-input"
          />
        </label>
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
          Nomor HP
          <input
            required
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mf-input"
          />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mf-input"
          />
        </label>
        {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
        <Button type="submit" disabled={status === "loading"} className="w-full">
          {status === "loading" ? "Mendaftar..." : "Daftar"}
        </Button>
        <p className="text-center text-sm text-muted">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-semibold text-primary">Masuk</Link>
        </p>
      </form>
    </div>
  );
}
