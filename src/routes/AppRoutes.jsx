import { Routes, Route } from "react-router-dom";
import App from "../../src/App.jsx";
import NotFound from "../pages/NotFound";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import Profil from "../pages/Profil.jsx";
// ADMIN
import AdminDashboard from "../pages/admin/Dashboard";
import DataMaster from "../pages/admin/DataMaster.jsx";
import Roles from "../pages/admin/Roles";
import SemesterManagement from "../pages/admin/Semester.jsx";
import PembayaranSPP from "../pages/admin/VerifSpp.jsx";
import AbsensiGuru from "../pages/admin/AbsensiGuru.jsx";
import PengumumanAdmin from "../pages/admin/Pengumuman.jsx";
import TuitionFee from "../pages/admin/Tagihan.jsx";
import TagihanNonBulanan from "../pages/admin/TagihanNonBulanan.jsx";

// GURU
import GuruDashboard from "../pages/guru/Dashboard";
import Kelas from "../pages/guru/Kelas";
import Rapor from "../pages/guru/Rapor";
import RiwayatAbsensi from "../pages/guru/RiwayatAbsensi";
// SISWA
import SiswaDashboard from "../pages/siswa/Dashboard";
import RaporSaya from "../pages/siswa/RaporSiswa.jsx";
import SppSaya from "../pages/siswa/SppSiswa.jsx";

import MainLayout from "../pages/MainLayout.jsx";

export default function AppRoutes() {
  const user = JSON.parse(localStorage.getItem("user"));
  const userRole = user ? user.role.nama : "guru";
  return (
    <Routes>
      <Route path="/" element={<App/>} />
      

      {/* ADMIN */}
      <Route element={<ProtectedRoute />}>
      <Route element={<MainLayout />}>
        
        {/* ADMIN */}
        <Route element={<RoleRoute allow={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/datamaster" element={<DataMaster />} />
          <Route path="/admin/roles" element={<Roles />} />
          <Route path="/admin/semester" element={<SemesterManagement />} />
          <Route path="/admin/verif-spp" element={<PembayaranSPP />} />
          <Route path="/admin/absensi-guru" element={<AbsensiGuru />} />
          
          <Route path="/admin/tagihan/facility-fee" element={<TagihanNonBulanan jenisTagihan="facility_fee" />} />
          <Route path="/admin/tagihan/material-fee" element={<TagihanNonBulanan jenisTagihan="material_fee" />} />
          <Route path="/admin/tagihan/tuition-fee" element={<TuitionFee  />} />
          <Route path="/admin/tagihan/paces" element={<TagihanNonBulanan jenisTagihan="paces" />} />
          <Route path="/admin/tagihan/miscellaneous" element={<TagihanNonBulanan jenisTagihan="miscellaneous" />} />
        </Route>

        {/* GURU */}
        <Route element={<RoleRoute allow={["guru","wali_kelas"]} />}>
          <Route path="/guru" element={<GuruDashboard />} />
          <Route path="/guru/kelas" element={<Kelas />} />
          <Route path="/guru/rapor" element={<Rapor />} />
          <Route path="/guru/riwayat-absensi" element={<RiwayatAbsensi />} />
        </Route>

        {/* SISWA */}
        <Route element={<RoleRoute allow={["siswa"]} />}>
          <Route path="/siswa" element={<SiswaDashboard />} />
          <Route path="/siswa/rapor" element={<RaporSaya />} />
          <Route path="/siswa/spp" element={<SppSaya />} />
        </Route>
        <Route path="/profil" element={<Profil role={user?.role.nama}/>} />
      </Route>
    </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
