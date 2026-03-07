import { Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import { List } from "react-bootstrap-icons";

function MainLayout() {
  const user = localStorage.getItem("user");
  const userData = user ? JSON.parse(user) : {};
  const userRole = userData ? userData?.role.nama : "siswa";

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto close mobile menu on resize to desktop
      if (!mobile) {
        setMobileOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    toast.success("Logout berhasil!");
  };

  // Calculate sidebar width - mobile is always 0 (overlay mode)
  const sidebarWidth = isMobile ? 0 : (isCollapsed ? 80 : 250);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <Sidebar
        role={userRole}
        onLogout={handleLogout}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content */}
      <div
        style={{
          marginLeft: `${sidebarWidth}px`,
          width: isMobile ? "100%" : `calc(100% - ${sidebarWidth}px)`,
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          transition: "margin-left 0.3s ease, width 0.3s ease",
          position: "relative"
        }}
      >
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              position: "fixed",
              top: "15px",
              left: "15px",
              zIndex: 1000,
              backgroundColor: "rgba(20, 51, 97, 1)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "10px 12px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: "500"
            }}
          >
            <List size={20} />
            <span>Menu</span>
          </button>
        )}

        {/* Content */}
        <Outlet />
      </div>

      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1500,
            transition: "opacity 0.3s ease"
          }}
        />
      )}
    </div>
  );
}

export default MainLayout;