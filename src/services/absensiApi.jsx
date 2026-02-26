import api from "./api";

export const getAbsensi = () => api.get("/absensi-guru");
export const getAbsensiByGuruToday = (guruId) => api.get(`/absensi-guru-today/${guruId}`);
export const createAbsensi = (data) => api.post("/absensi-guru", data);
export const updateAbsensi = (id, data) => api.put(`/absensi-guru/${id}`, data);
export const getAbsensiById = (guruId) => api.get(`/absensi-guru/${guruId}`);
export const generateLaporanPDF = (sesiId) => api.get(`/sesi-absensi/${sesiId}/laporan-pdf`, {
  responseType: 'blob'
});
export const generateLaporanBulanan = (bulan, tahun, semesterId, totalHari) =>
    api.get("/laporan/absensi-bulanan", {
        params: { bulan, tahun, semester_id: semesterId, total_hari: totalHari },
        responseType: "blob", // ✅ penting untuk PDF
    });
// Sesi Absensi
export const getSesiAbsensi = (params) => api.get("/sesi-absensi", { params });
export const getSesiAbsensiAktif = () => api.get("/sesi-absensi/aktif");
export const createSesiAbsensi = (data) => api.post("/sesi-absensi", data);
export const closeSesiAbsensi = (id, data) => api.post(`/sesi-absensi/${id}/close`, data);
export const updateSesiAbsensi = (id, data) => api.put(`/sesi-absensi/${id}`, data);
export const getSesiAbsensiById = (id) => api.get(`/sesi-absensi/${id}`);
export const getHariLibur = (month, year) => 
    api.get(`/hari-libur?month=${month}&year=${year}`);