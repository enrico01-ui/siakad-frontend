import api from "./api";

export const getSemester = () => api.get("/semester");

export const createSemester = (data) =>
  api.post("/semester", data);

export const aktifkanSemester = (id) =>
  api.put(`/semester/${id}/activate`);

