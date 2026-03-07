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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-collapse on mobile
      if (mobile) {
        setIsCollapsed(false);
        setMobileOpen(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    toast.success("Logout berhasil!");
  };

  // Calculate sidebar width based on state
  const getSidebarWidth = () => {
    if (isMobile) {
      return 0; // No width on mobile when closed
    }
    return isCollapsed ? 80 : 250;
  };

  const sidebarWidth = getSidebarWidth();

  return (
    <div className="d-flex" style={{ position: "relative", minHeight: "100vh" }}>
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
          width: `calc(100% - ${sidebarWidth}px)`,
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          transition: "all 0.3s ease",
          position: "relative"
        }}
      >
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              position: "fixed",
              top: "15px",
              left: "15px",
              zIndex: 1000,
              backgroundColor: "rgba(20, 51, 97, 1)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "10px 15px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Menu
          </button>
        )}

        {/* Content with padding for mobile menu button */}
        <div style={{ paddingTop: isMobile ? "60px" : "0" }}>
          <Outlet />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
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