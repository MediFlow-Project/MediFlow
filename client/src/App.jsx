import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { bootstrapMe } from "./store/authSlice";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Specialties from "./pages/Specialties";
import SpecialtyDetail from "./pages/SpecialtyDetail";
import Doctors from "./pages/Doctors";
import DoctorDetail from "./pages/DoctorDetail";
import Booking from "./pages/Booking";
import Chatbot from "./pages/Chatbot";
import PatientDashboard from "./pages/PatientDashboard";
import PatientQueue from "./pages/PatientQueue";
import InvoicePage from "./pages/InvoicePage";
import DoctorHome from "./pages/DoctorHome";
import AdminAppointments from "./pages/AdminAppointments";
import AdminSpecialties from "./pages/AdminSpecialties";
import AdminDoctors from "./pages/AdminDoctors";
import AdminSchedules from "./pages/AdminSchedules";
import AdminMedicines from "./pages/AdminMedicines";
import NotFound from "./pages/NotFound";
import Loading from "./components/Loading";

export default function App() {
  const dispatch = useDispatch();
  const { status, token } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(bootstrapMe());
  }, [dispatch]);

  if (token && status === "loading") {
    return <Loading label="Menyiapkan MediFlow..." />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/spesialisasi" element={<Specialties />} />
          <Route path="/spesialisasi/:id" element={<SpecialtyDetail />} />
          <Route path="/daftar-dokter" element={<Doctors />} />
          <Route path="/daftar-dokter/:id" element={<DoctorDetail />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route
            path="/daftar-dokter/:id/pesan"
            element={
              <ProtectedRoute roles={["patient"]}>
                <Booking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saya"
            element={
              <ProtectedRoute roles={["patient"]}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saya/antrean/:id"
            element={
              <ProtectedRoute roles={["patient"]}>
                <PatientQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tagihan"
            element={
              <ProtectedRoute roles={["patient"]}>
                <InvoicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tagihan/:id"
            element={
              <ProtectedRoute roles={["patient"]}>
                <InvoicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dokter"
            element={
              <ProtectedRoute roles={["doctor"]}>
                <DoctorHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={<Navigate to="/admin/janji" replace />}
          />
          <Route
            path="/admin/janji"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/spesialisasi"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminSpecialties />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dokter"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDoctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/jadwal"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminSchedules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/obat"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminMedicines />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
