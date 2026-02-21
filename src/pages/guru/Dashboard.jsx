import { Container, Row, Col, Card, ProgressBar, Badge, Table, Spinner, Alert } from "react-bootstrap";
import { useEffect, useState } from "react";
import {
  Book, People, FileEarmarkArrowUp, Calendar, Clock,
  CheckCircle, Megaphone, PersonCircle, ChevronRight,
  FileEarmarkPdf, XCircle
} from "react-bootstrap-icons";
import { getGuruKelas, getKelasSiswa } from "../../services/guruApi";
import { getRapor } from "../../services/raporApi";
import { getPengumumanGuru } from "../../services/pengumumanApi";

export default function DashboardGuru() {
  const user = JSON.parse(localStorage.getItem("user"));
  const guru = user ? user.guru : null;
  const isWaliKelas = guru?.peran === "wali_kelas";

  const [kelasList, setKelasList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [raporList, setRaporList] = useState([]);
  const [pengumumanList, setPengumumanList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (isWaliKelas) {
        // Fetch kelas & siswa
        const kelasRes = await getGuruKelas();
        const kelas = kelasRes.data.kelas || [];
        setKelasList(kelas);

        let allSiswa = [];
        for (const k of kelas) {
          const res = await getKelasSiswa(k.id);
          allSiswa = [...allSiswa, ...(res.data.data || [])];
        }
        setSiswaList(allSiswa);

        // Fetch rapor
        const raporRes = await getRapor();
        setRaporList(raporRes.data || []);

        // Fetch pengumuman
        const pengRes = await getPengumumanGuru();
        setPengumumanList(pengRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const siswaWithRapor = siswaList.filter(s =>
    raporList.some(r => r.siswa_id === s.id)
  ).length;

  const raporProgress = siswaList.length > 0
    ? Math.round((siswaWithRapor / siswaList.length) * 100)
    : 0;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric"
    });

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>

      {/* ── HEADER BANNER ── */}
      <div
        className="rounded-3 p-4 mb-4 text-white"
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}
      >
        <h4 className="mb-1 fw-bold">
          {isWaliKelas ? "Dashboard Wali Kelas" : "Dashboard Guru"}
        </h4>
        <p className="mb-0 opacity-90">
          Selamat datang, <strong>{guru?.nama}</strong> — SIAKAD Hagios School of Life
        </p>
        {isWaliKelas && (
          <div className="mt-2">
            {kelasList.map(k => (
              <Badge key={k.id} bg="light" text="dark" className="me-1">
                {k.nama_kelas}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* ── STATS CARDS ── */}
          {isWaliKelas ? (
            <Row className="g-3 mb-4">
              {[
                { title: "Total Siswa", value: siswaList.length, color: "primary", bg: "#eff6ff", Icon: People },
                { title: "Jumlah Kelas", value: kelasList.length, color: "success", bg: "#f0fdf4", Icon: Book },
                { title: "Rapor Terupload", value: siswaWithRapor, color: "info", bg: "#f0f9ff", Icon: FileEarmarkPdf },
                { title: "Pengumuman Aktif", value: pengumumanList.filter(p => p.is_active).length, color: "warning", bg: "#fffbeb", Icon: Megaphone },
              ].map(({ title, value, color, bg, Icon }) => (
                <Col key={title} lg={3} md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="text-muted mb-1 small">{title}</p>
                        <h3 className={`mb-0 fw-bold text-${color}`}>{value}</h3>
                      </div>
                      <div className="d-flex align-items-center justify-content-center rounded-3"
                        style={{ width: 60, height: 60, backgroundColor: bg, color: `var(--bs-${color})` }}>
                        <Icon size={28} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            // Guru biasa — hanya kehadiran
            <Row className="g-3 mb-4">
              <Col lg={3} md={6}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1 small">Kehadiran Hari Ini</p>
                      <h3 className="mb-0 fw-bold text-success">-</h3>
                    </div>
                    <div className="bg-success bg-opacity-10 p-3 rounded-3">
                      <CheckCircle size={28} className="text-success" />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* ── WALI KELAS CONTENT ── */}
          {isWaliKelas && (
            <Row className="g-3">

              {/* ── KELAS & SISWA ── */}
              <Col lg={7}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-bold mb-0">
                        <People size={20} className="me-2 text-primary" />
                        Data Kelas
                      </h5>
                      <Badge bg="primary" pill>{siswaList.length} siswa</Badge>
                    </div>

                    {/* Progress Rapor */}
                    <Card className="bg-light border-0 mb-4">
                      <Card.Body className="py-3">
                        <div className="d-flex justify-content-between mb-2">
                          <small className="fw-semibold">Progress Upload Rapor</small>
                          <small className="fw-bold text-primary">{raporProgress}%</small>
                        </div>
                        <ProgressBar
                          now={raporProgress}
                          variant={raporProgress >= 80 ? "success" : raporProgress >= 50 ? "warning" : "danger"}
                          style={{ height: 8 }}
                          className="rounded-pill"
                        />
                        <small className="text-muted mt-2 d-block">
                          {siswaWithRapor} dari {siswaList.length} siswa sudah memiliki rapor
                        </small>
                      </Card.Body>
                    </Card>

                    {/* Tabel siswa */}
                    <div style={{ maxHeight: 320, overflowY: "auto" }}>
                      <Table hover size="sm" className="mb-0">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th>No</th>
                            <th>Nama Siswa</th>
                            <th>NIS</th>
                            <th>Kelas</th>
                            <th className="text-center">Rapor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {siswaList.length > 0 ? siswaList.map((siswa, i) => {
                            const hasRapor = raporList.some(r => r.siswa_id === siswa.id);
                            return (
                              <tr key={siswa.id}>
                                <td className="text-muted">{i + 1}</td>
                                <td className="fw-medium">{siswa.nama}</td>
                                <td className="text-muted">{siswa.nis || "-"}</td>
                                <td>
                                  <Badge bg="secondary" className="fw-normal">
                                    {siswa.kelas?.nama_kelas || "-"}
                                  </Badge>
                                </td>
                                <td className="text-center">
                                  {hasRapor
                                    ? <CheckCircle size={16} className="text-success" />
                                    : <XCircle size={16} className="text-danger" />
                                  }
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr>
                              <td colSpan={5} className="text-center text-muted py-3">
                                Belum ada data siswa
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              {/* ── PENGUMUMAN ── */}
              <Col lg={5}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-bold mb-0">
                        <Megaphone size={20} className="me-2 text-warning" />
                        Pengumuman Saya
                      </h5>
                      <Badge bg="warning" text="dark" pill>
                        {pengumumanList.filter(p => p.is_active).length} aktif
                      </Badge>
                    </div>

                    {pengumumanList.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        <Megaphone size={40} className="mb-2 opacity-25" />
                        <p className="mb-0 small">Belum ada pengumuman</p>
                      </div>
                    ) : (
                      <div style={{ maxHeight: 420, overflowY: "auto" }}>
                        {pengumumanList.map((p) => (
                          <div
                            key={p.id}
                            className="border rounded-3 p-3 mb-2"
                            style={{ backgroundColor: p.is_active ? "#fffbeb" : "#f8f9fa" }}
                          >
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <p className="fw-semibold mb-0 me-2" style={{ fontSize: "0.9rem" }}>
                                {p.judul}
                              </p>
                              {p.is_active
                                ? <Badge bg="success" className="flex-shrink-0">Aktif</Badge>
                                : <Badge bg="secondary" className="flex-shrink-0">Nonaktif</Badge>
                              }
                            </div>
                            <p
                              className="text-muted mb-2"
                              style={{
                                fontSize: "0.8rem",
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical"
                              }}
                            >
                              {p.isi}
                            </p>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                <Calendar size={12} className="me-1" />
                                {formatDate(p.created_at)}
                              </small>
                              {p.attachments?.length > 0 && (
                                <small className="text-muted">
                                  📎 {p.attachments.length} lampiran
                                </small>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>

            </Row>
          )}

          {/* ── GURU BIASA INFO ── */}
          {!isWaliKelas && (
            <Alert variant="info">
              <strong>Info:</strong> Anda login sebagai Guru Mata Pelajaran.
              Untuk melihat data kelas dan upload rapor, fitur tersebut hanya tersedia untuk Wali Kelas.
            </Alert>
          )}
        </>
      )}
    </Container>
  );
}