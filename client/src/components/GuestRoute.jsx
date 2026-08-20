import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loading from "./Loading";
import { homeForRole } from "../utils/format";

export default function GuestRoute({ children }) {
  const { token, user, status } = useSelector((state) => state.auth);

  if (status === "loading") {
    return <Loading label="Menyiapkan sesi..." />;
  }

  if (token && user) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return children;
}
