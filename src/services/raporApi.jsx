import api from "./api";

export const getRapor = () => api.get("/rapor");
export const getRaporSaya = () => api.get("/rapor-saya");

export const uploadRaporFile = (data) =>
  api.post("/rapor", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateRapor = (id, data) => api.put(`/rapor/${id}`, data);
export const deleteRapor = (id) => api.delete(`/rapor/${id}`);