import { Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";

function MainLayout() {
  const user = localStorage.getItem("user");
  const userData = user ? JSON.parse(user) : {};
  const userRole = userData ? userData?.role.nama : "siswa";
  
  const handleLogout = () => {
    toast.success("Logout berhasil!");
  };

  return (
    <div className="d-flex">
      <Sidebar role={userRole} onLogout={handleLogout} />

      <div
        style={{
          marginLeft: "250px",
          width: "calc(100% - 250px)",
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;
