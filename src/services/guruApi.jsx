import api from "./api";

export const getGuru = () => api.get("/guru");
export const createGuru = (data) => api.post("/guru", data);
export const updateGuru = (id, data) => api.put(`/guru/${id}`, data);
export const deleteGuru = (id) => api.delete(`/guru/${id}`);
export const getGuruKelas = () => api.get("/guru-kelas");
export const getKelasSiswa = (kelasId) => api.get(`/kelas-siswa/${kelasId}`);