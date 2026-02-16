import api from "./api";

export const getSiswa = () => api.get("/siswa");
export const createSiswa = (data) => api.post("/siswa", data);
export const updateSiswa = (id, data) => api.put(`/siswa/${id}`, data);
export const deleteSiswa = (id) => api.delete(`/siswa/${id}`);
