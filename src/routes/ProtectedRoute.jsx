import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../services/auth";

export default function ProtectedRoute() {
  const token = getToken();

  return token ? <Outlet /> : <Navigate to="/" replace />;
}
