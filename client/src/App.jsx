import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { bootstrapMe } from "./store/authSlice";
import AppLayout from "./layouts/AppLayout";
import AdminShell from "./layouts/AdminShell";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Services from "./pages/Services";
import SpecialtyDetail from "./pages/SpecialtyDetail";
import DoctorDetail from "./pages/DoctorDetail";
import Booking from "./pages/Booking";
import PatientDashboard from "./pages/PatientDashboard";
import PatientQueue from "./pages/PatientQueue";
import InvoicePage from "./pages/InvoicePage";
import DoctorHome from "./pages/DoctorHome";
import ChatInbox from "./pages/ChatInbox";
import ChatPage from "./pages/ChatPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminInvoices from "./pages/AdminInvoices";
import AdminAppointments from "./pages/AdminAppointments";
import AdminSpecialties from "./pages/AdminSpecialties";
import AdminDoctors from "./pages/AdminDoctors";
import AdminSchedules from "./pages/AdminSchedules";
import AdminMedicines from "./pages/AdminMedicines";
import NotFound from "./pages/NotFound";
import Account from "./pages/Account";
import Loading from "./components/Loading";
import Toast from "./components/Toast";
import ChatbotWidget from "./components/ChatbotWidget";
import { ToastProvider } from "./context/ToastContext";

function RedirectToLayanan({ hash = "" }) {
  const [params] = useSearchParams();
  const search = params.toString();
  return (
    <Navigate to={`/layanan${search ? `?${search}` : ""}${hash}`} replace />
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { status, token } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(bootstrapMe());
  }, [dispatch]);

  if (token && status === "loading") {
    return <Loading label="Menyiapkan portal rumah sakit..." />;
  }

  return (
    <BrowserRouter>
      <ToastProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              <GuestRoute>
                <Landing />
              </GuestRoute>
            }
          />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route path="/layanan" element={<Services />} />
          <Route
            path="/spesialisasi"
            element={<RedirectToLayanan hash="#poliklinik" />}
          />
          <Route path="/spesialisasi/:id" element={<SpecialtyDetail />} />
          <Route
            path="/daftar-dokter"
            element={<RedirectToLayanan hash="#dokter" />}
          />
          <Route path="/daftar-dokter/:id" element={<DoctorDetail />} />
          <Route path="/chatbot" element={<Navigate to="/" replace />} />
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
            path="/pesan"
            element={
              <ProtectedRoute roles={["patient", "doctor"]}>
                <ChatInbox />
              </ProtectedRoute>
            }
          >
            <Route path=":appointmentId" element={<ChatPage />} />
          </Route>
          <Route
            path="/akun"
            element={
              <ProtectedRoute>
                <Account />
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
          <Route path="/admin" element={<AdminShell />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="janji" element={<AdminAppointments />} />
            <Route path="tagihan" element={<AdminInvoices />} />
            <Route path="spesialisasi" element={<AdminSpecialties />} />
            <Route path="dokter" element={<AdminDoctors />} />
            <Route path="jadwal" element={<AdminSchedules />} />
            <Route path="obat" element={<AdminMedicines />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toast />
      <ChatbotWidget />
      </ToastProvider>
    </BrowserRouter>
  );
}
