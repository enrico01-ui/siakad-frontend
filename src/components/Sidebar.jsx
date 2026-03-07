import { Nav, Dropdown, Collapse } from "react-bootstrap";
import './sidebar.css';
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  House,
  Person,
  FileEarmarkArrowUp,
  People,
  BoxArrowRight,
  CashStack,
  ClipboardCheck,
  FileEarmarkText,
  List,
  ChevronDown,
  ChevronRight,
  Calendar,
  X
} from "react-bootstrap-icons";
import { User } from "lucide-react";

export default function Sidebar({ 
  role, 
  onLogout, 
  isCollapsed, 
  setIsCollapsed,
  isMobile,
  mobileOpen,
  setMobileOpen 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState({
    tagihan: false,
  });
  
  const user = JSON.parse(localStorage.getItem("user"));

  const menuItems = {
    admin: [
      { label: "Dashboard", icon: House, path: "/admin" },
      { label: "Pembayaran", icon: CashStack, path: "/admin/verifikasi-spp" },
      { 
        label: "Tagihan", 
        icon: FileEarmarkText, 
        hasSubmenu: true,
        submenu: [
          { label: "Facility Fee", path: "/admin/tagihan/facility-fee" },
          { label: "Material Fee", path: "/admin/tagihan/material-fee" },
          { label: "Tuition Fee", path: "/admin/tagihan/tuition-fee" },
          { label: "PACEs", path: "/admin/tagihan/paces" },
          { label: "Miscellaneous", path: "/admin/tagihan/miscellaneous" },
        ]
      },
      { label: "Absensi Guru", icon: ClipboardCheck, path: "/admin/absensi-guru" },
      { label: "Data Master", icon: FileEarmarkText, path: "/admin/datamaster" },
      { label: "Semester", icon: Calendar, path: "/admin/semester" },
    ],
    wali_kelas: [
      { label: "Dashboard", icon: House, path: "/guru" },
      { label: "Kelas Saya", icon: People, path: "/guru/kelas" },
      { label: "Pengumuman", icon: FileEarmarkArrowUp, path: "/guru/pengumuman" },
      { label: "Riwayat Absensi", icon: ClipboardCheck, path: "/guru/riwayat-absensi" }
    ],
    guru: [
      { label: "Dashboard", icon: House, path: "/guru" },
      { label: "Riwayat Absensi", icon: ClipboardCheck, path: "/guru/riwayat-absensi" }
    ],
    coach: [
      { label: "Dashboard", icon: House, path: "/guru" },
      { label: "Riwayat Absensi", icon: ClipboardCheck, path: "/guru/riwayat-absensi" }
    ],
    financial: [
      { label: "Dashboard", icon: House, path: "/guru" },
      { label: "Riwayat Absensi", icon: ClipboardCheck, path: "/guru/riwayat-absensi" }
    ],
    siswa: [
      { label: "Dashboard", icon: House, path: "/siswa" },
      { label: "Rapor", icon: FileEarmarkText, path: "/siswa/rapor" },
      { label: "Status Tagihan", icon: CashStack, path: "/siswa/tagihan" }
    ]
  };

  const currentMenuItems = menuItems[role] || menuItems.siswa;

  const handleMenuClick = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleToggleSubmenu = (menuLabel) => {
    setOpenSubmenu(prev => ({
      ...prev,
      [menuLabel.toLowerCase()]: !prev[menuLabel.toLowerCase()]
    }));
  };

  const handleLogoutClick = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      onLogout();
      navigate("/");
    }
  };

  const handleToggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isSubmenuActive = (submenu) => {
    return submenu.some(item => location.pathname === item.path);
  };

  // Sidebar positioning and sizing
  const getSidebarStyle = () => {
    if (isMobile) {
      // Mobile: Fixed overlay, slide in from left
      return {
        width: "280px",
        maxWidth: "85vw",
        left: mobileOpen ? "0" : "-100%",
        transition: "left 0.3s ease"
      };
    } else {
      // Desktop: Fixed sidebar that can collapse
      return {
        width: isCollapsed ? "80px" : "250px",
        left: "0",
        transition: "width 0.3s ease"
      };
    }
  };

  const sidebarStyle = getSidebarStyle();

  return (
    <div
      style={{
        ...sidebarStyle,
        height: "100vh",
        backgroundColor: "rgba(20, 51, 97, 1)",
        position: "fixed",
        top: 0,
        color: "#fff",
        zIndex: 2000,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Header */}
      <div 
        className="border-bottom border-white border-opacity-10"
        style={{
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed && !isMobile ? "center" : "space-between"
        }}
      >
        {(!isCollapsed || isMobile) && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div 
              style={{
                width: "35px",
                height: "35px",
                backgroundColor: "#fff",
                color: "rgba(37, 150, 190, 1)",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              HS
            </div>
            <span style={{ fontWeight: "bold", fontSize: "16px" }}>SIAKAD</span>
          </div>
        )}
        
        {isMobile ? (
          <X 
            size={24} 
            style={{ cursor: "pointer", flexShrink: 0 }} 
            onClick={() => setMobileOpen(false)}
          />
        ) : (
          <List 
            size={20} 
            style={{ cursor: "pointer", flexShrink: 0 }} 
            onClick={handleToggleSidebar}
          />
        )}
      </div>

      {/* User Section */}
      {(!isCollapsed || isMobile) && (
        <Dropdown className="border-bottom border-white border-opacity-10"> 
          <Dropdown.Toggle
            variant="link"
            className="text-white text-decoration-none w-100"
            style={{ 
              backgroundColor: "transparent",
              border: "none",
              boxShadow: "none",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}
          >
            <div 
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <User size={24} />
            </div>
            <div style={{ textAlign: "left", overflow: "hidden" }}>
              <div style={{ fontSize: "14px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.guru?.nama || user?.name || "Admin"}
              </div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                {user?.role?.nama || "User"}
              </div>
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu
            style={{
              backgroundColor: "rgb(28, 62, 112)",
              padding: "4px",
              width: "calc(100% - 32px)",
              margin: "0 16px",
              borderRadius: "8px",
            }}
          >
            <Dropdown.Item
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleMenuClick("/profil");
              }}
              style={{
                color: "white",
                fontSize: "13px",
                padding: "10px",
                display: "flex",
                alignItems: "center",
                borderRadius: "6px",
                backgroundColor: "transparent"
              }}
            >
              <Person size={14} style={{ marginRight: "8px" }} />
              Lihat Profil
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      )}

      {/* Logo */}
      {(!isCollapsed || isMobile) && (
        <div style={{ textAlign: "center", padding: "20px 16px" }}>
          <img 
            src="https://hagiosschooloflife.sch.id/img/navbar/logo-hsol.webp" 
            alt="Logo HSOL" 
            style={{ width: "100%", maxWidth: "120px" }}
          />
        </div>
      )}

      {/* Menu Items */}
      <Nav 
        className="flex-column flex-grow-1" 
        style={{ 
          padding: "0 16px",
          marginBottom: "0",
          paddingBottom: "0"
        }}
      >
        {currentMenuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const hasSubmenu = item.hasSubmenu;
          const isSubmenuOpen = openSubmenu[item.label.toLowerCase()];
          const isAnySubmenuActive = hasSubmenu && isSubmenuActive(item.submenu);

          return (
            <div key={index}>
              {/* Main Menu Item */}
              <Nav.Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (hasSubmenu) {
                    handleToggleSubmenu(item.label);
                  } else {
                    handleMenuClick(item.path);
                  }
                }}
                className="text-white position-relative"
                style={{
                  backgroundColor: (isActive || isAnySubmenuActive) ? "#ff9800" : "transparent",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "14px",
                  fontWeight: (isActive || isAnySubmenuActive) ? "500" : "400",
                  transition: "all 0.3s ease",
                  marginBottom: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isAnySubmenuActive) {
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !isAnySubmenuActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {(!isCollapsed || isMobile) && (
                  <>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {hasSubmenu && (
                      isSubmenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    )}
                  </>
                )}
                {(isActive || isAnySubmenuActive) && (
                  <div 
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "4px",
                      height: "70%",
                      backgroundColor: "#fff",
                      borderRadius: "0 4px 4px 0"
                    }}
                  />
                )}
              </Nav.Link>

              {/* Submenu */}
              {hasSubmenu && (!isCollapsed || isMobile) && (
                <Collapse in={isSubmenuOpen}>
                  <div>
                    {item.submenu.map((subItem, subIndex) => {
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <Nav.Link
                          key={subIndex}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleMenuClick(subItem.path);
                          }}
                          className="text-white"
                          style={{
                            backgroundColor: isSubActive ? "rgba(255,152,0,0.3)" : "transparent",
                            borderRadius: "8px",
                            padding: "10px 16px 10px 48px",
                            fontSize: "13px",
                            fontWeight: isSubActive ? "500" : "400",
                            transition: "all 0.3s ease",
                            borderLeft: isSubActive ? "3px solid #ff9800" : "3px solid transparent",
                            marginLeft: "12px",
                            marginBottom: "2px"
                          }}
                          onMouseEnter={(e) => {
                            if (!isSubActive) {
                              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSubActive) {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }
                          }}
                        >
                          {subItem.label}
                        </Nav.Link>
                      );
                    })}
                  </div>
                </Collapse>
              )}
            </div>
          );
        })}
      </Nav>

      {/* Logout Button */}
      <div className="border-top border-white border-opacity-10">
        <Nav.Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleLogoutClick();
          }}
          className="text-white"
          style={{ 
            padding: "16px", 
            fontSize: "14px",
            transition: "background-color 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <BoxArrowRight size={18} />
          {(!isCollapsed || isMobile) && "Keluar"}
        </Nav.Link>
      </div>
    </div>
  );
}