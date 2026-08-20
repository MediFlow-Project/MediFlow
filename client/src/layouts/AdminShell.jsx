import { Outlet } from "react-router-dom";
import AdminNav from "../components/AdminNav";
import ProtectedRoute from "../components/ProtectedRoute";

export default function AdminShell() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="mf-fade">
        <AdminNav />
        <Outlet />
      </div>
    </ProtectedRoute>
  );
}
