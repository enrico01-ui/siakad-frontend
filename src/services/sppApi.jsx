import api from "./api";

export const getSpp = () => api.get("/pembayaran-spp");
export const getSppSaya = () => api.get("/pembayaran-spp-saya");
export const createTagihanBulk = (data) => api.post("/tagihan-spp/bulk", data);
export const verifySpp = (id) =>
  api.post(`/pembayaran-spp/${id}/verify`);
export const getSppDetail = (id) => api.get(`/pembayaran-spp/${id}`);
export const rejectSpp = (id, catatan) => api.post(`/pembayaran-spp/${id}/reject`, { catatan });
export const bulkCreateTagihan = (data) => api.post("/tagihan/bulk", data);
export const getTagihanSpp = (params) => api.get("/tagihan-spp", { params });
export const getTagihanSppSiswa = (siswaId, semesterId) => 
  api.get(`/pembayaran-spp/tagihan-siswa/${siswaId}/${semesterId}`);
export const createTagihanSpp = (data) => api.post("/tagihan-spp", data);
export const updateTagihanSpp = (id, data) => api.put(`/tagihan-spp/${id}`, data);
export const deleteTagihanSpp = (id) => api.delete(`/tagihan-spp/${id}`);

export const approveIzin = (absensiId) => api.post(`/absensi-guru/${absensiId}/approve-izin`);
export const rejectIzin = (absensiId, data) => api.post(`/absensi-guru/${absensiId}/reject-izin`, data);