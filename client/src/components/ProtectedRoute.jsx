import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Loading from "./Loading";
import { homeForRole } from "../utils/format";

export default function ProtectedRoute({ children, roles }) {
  const { token, user, status } = useSelector((state) => state.auth);
  const location = useLocation();

  if (status === "loading") {
    return <Loading label="Menyiapkan sesi..." />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return children;
}
