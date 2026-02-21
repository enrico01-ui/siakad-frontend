import api from "./api";

// ADMIN
export const createPengumuman = (data) =>
    api.post("/pengumuman", data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

export const getAllPengumuman = () =>
  api.get("/pengumuman");

export const nonaktifkanPengumuman = (id) =>
  api.put(`/pengumuman/${id}/nonaktif`);

// SISWA
export const getPengumumanSiswa = () =>
  api.get("/pengumuman-siswa");

export const getPengumumanKelas = () =>
  api.get("/pengumuman-kelas");

export const getPengumumanGuru = () =>
  api.get("/pengumuman-guru");