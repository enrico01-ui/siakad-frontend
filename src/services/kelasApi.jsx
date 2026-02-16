import api from "./api";

export const getKelas = () => api.get("/kelas");
export const createKelas = (data) => api.post("/kelas", data);
export const updateKelas = (id, data) => api.put(`/kelas/${id}`, data);
export const deleteKelas = (id) => api.delete(`/kelas/${id}`);
