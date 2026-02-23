import { Nav, Dropdown, Collapse } from "react-bootstrap";
import './sidebar.css';
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
  Calendar
} from "react-bootstrap-icons";
import { useState } from "react";
import { icons } from "lucide-react";

export default function Sidebar({ role, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // ⭐ State untuk submenu
  const [openSubmenu, setOpenSubmenu] = useState({
    tagihan: false,
  });
  
  const user = JSON.parse(localStorage.getItem("user"));

  const menuItems = {
    admin: [
      { label: "Dashboard", icon: House, path: "/admin" },
      { label: "Pembayaran", icon: CashStack, path: "/admin/verif-spp" },
      
      // ⭐ UPDATED: Tagihan dengan submenu
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
    localStorage.setItem("sidebarCollapsed", JSON.stringify(!isCollapsed));
    console.log(`Sidebar ${!isCollapsed ? 'collapsed' : 'expanded'}`);
  };

  const getUserData = () => {
    switch(role) {
      case 'admin':
        return { name: 'Admin User', role: 'Administrator', initials: 'AD' };
      case 'guru':
        return { name: 'Nama Guru', role: 'Guru', initials: 'GR' };
      default:
        return { name: 'Naufal Dhean', role: 'Siswa', initials: 'NH' };
    }
  };

  const userData = getUserData();

  // Helper untuk cek apakah submenu item active
  const isSubmenuActive = (submenu) => {
    return submenu.some(item => location.pathname === item.path);
  };

  return (
    <div 
      className="d-flex flex-column"
      style={{
        width: isCollapsed ? "80px" : "250px",
        height: "100vh",
        backgroundColor: "rgba(20, 51, 97, 1)",
        position: "fixed",
        color: "#fff",
        transition: "width 0.3s ease",
        zIndex: 1000
      }}
    >
      {/* Header */}
      <div className={`d-flex align-items-center justify-content-${isCollapsed ? "center" : "between"} p-3 border-bottom border-white border-opacity-10`}>
        {!isCollapsed && (
          <div className="d-flex align-items-center gap-2">
            <div 
              className="d-flex align-items-center justify-content-center fw-bold"
              style={{
                width: "35px",
                height: "35px",
                backgroundColor: "#fff",
                color: "rgba(37, 150, 190, 1)",
                borderRadius: "8px",
                fontSize: "14px"
              }}
            >
              HS
            </div>
            <span className="fw-bold">SIAKAD</span>
          </div>
        )}
        <List 
          size={20} 
          style={{ cursor: "pointer" }} 
          onClick={handleToggleSidebar}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        />
      </div>

      {/* User Section with Dropdown */}
      {!isCollapsed && (
        <Dropdown className="border-bottom border-white border-opacity-10"> 
          <Dropdown.Toggle
            variant="link"
            className="user-dropdown-toggle text-white text-decoration-none w-100 d-flex align-items-center gap-2 p-3"
            style={{ 
              backgroundColor: "transparent",
              border: "none",
              boxShadow: "none",
            }}
          >
            <div 
              className="d-flex align-items-center justify-content-center fw-bold"
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "8px"
              }}
            >
              <icons.User size={24} />
            </div>
            <div className="flex-grow-1 text-start">
              <div className="fw-medium" style={{ fontSize: "14px" }}>
                {user.guru != null ? user.guru.nama : "Admin"}
              </div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                {user.role?.nama}
              </div>
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu
            style={{
              backgroundColor: "rgb(28, 62, 112)",
              padding: "1px",
              width: "100%",
              borderRadius: "8px",
            }}
          >
            <Dropdown.Item
              className="user-dropdownmenu-toggle"
              href="#"
              onClick={() => handleMenuClick("/profil")}
              style={{
                color: "white",
                fontSize: "13px",
                padding: "10px",
                lineHeight: "16px",
                display: "flex",
                alignItems: "center",
                borderRadius: "6px",
              }}
            >
              <Person size={14} className="me-2" />
              Lihat Profil
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      )}

      {/* Logo */}
      {!isCollapsed && (
        <div className="text-center py-3">
          <img 
            src="https://hagiosschooloflife.sch.id/img/navbar/logo-hsol.webp" 
            alt="Logo HSOL" 
            style={{ width: "120px" }}
          />
        </div>
      )}

      {/* Menu Items */}
      <Nav className="flex-column flex-grow-1 px-3" style={{marginBottom: "0", paddingBottom: "0"}}>
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
                className="text-white d-flex align-items-center gap-2 mb-1 position-relative"
                style={{
                  backgroundColor: (isActive || isAnySubmenuActive) ? "#ff9800" : "transparent",
                  borderRadius: "12px",
                  padding: "10px 15px",
                  fontSize: "14px",
                  fontWeight: (isActive || isAnySubmenuActive) ? "500" : "400",
                  transition: "all 0.3s ease"
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
                title={isCollapsed ? item.label : ""}
              >
                <Icon size={18} />
                {!isCollapsed && (
                  <>
                    <span className="flex-grow-1">{item.label}</span>
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

              {/* Submenu Items */}
              {hasSubmenu && !isCollapsed && (
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
                          className="text-white d-flex align-items-center gap-2 mb-1"
                          style={{
                            backgroundColor: isSubActive ? "rgba(255,152,0,0.3)" : "transparent",
                            borderRadius: "8px",
                            padding: "8px 15px 8px 45px",
                            fontSize: "13px",
                            fontWeight: isSubActive ? "500" : "400",
                            transition: "all 0.3s ease",
                            borderLeft: isSubActive ? "3px solid #ff9800" : "3px solid transparent",
                            marginLeft: "10px"
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

      {/* Bottom Section */}
      <div className="border-top border-white border-opacity-10">
        <Nav.Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleLogoutClick();
          }}
          className="text-white d-flex align-items-center gap-2"
          style={{ 
            padding: "12px 20px", 
            fontSize: "14px",
            transition: "background-color 0.3s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          title={isCollapsed ? "Keluar" : ""}
        >
          <BoxArrowRight size={18} />
          {!isCollapsed && "Keluar"}
        </Nav.Link>
      </div>
    </div>
  );
}