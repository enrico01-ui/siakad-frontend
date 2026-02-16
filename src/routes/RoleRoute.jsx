import { Navigate, Outlet } from "react-router-dom";
import { getUser } from "../services/auth";

export default function RoleRoute({ allow }) {
  const user = getUser();

  if (!user) return <Navigate to="/" replace />;

  return allow.includes(user.role.nama)
    ? <Outlet />
    : <Navigate to="/" replace />;
}
