import { Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";

function MainLayout() {
  const user = localStorage.getItem("user");
  const userData = user ? JSON.parse(user) : {};
  const userRole = userData ? userData?.role.nama : "siswa";

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    toast.success("Logout berhasil!");
  };

  const sidebarWidth = isMobile ? 0 : isCollapsed ? 80 : 250;

  return (
    <div className="d-flex">
      <Sidebar
        role={userRole}
        onLogout={handleLogout}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div
        style={{
          marginLeft: sidebarWidth,
          width: `calc(100% - ${sidebarWidth}px)`,
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          transition: "all 0.3s ease"
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;