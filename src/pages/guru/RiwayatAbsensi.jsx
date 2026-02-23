// src/pages/guru/RiwayatAbsensi.jsx
import { useEffect, useState } from "react";
import {
  Container, Row, Col, Card, Badge, Spinner, Modal, Table
} from "react-bootstrap";
import { ClockHistory, Calendar, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { getSesiAbsensi } from "../../services/absensiApi";

export default function RiwayatAbsensi() {
  const user = JSON.parse(localStorage.getItem("user"));
  const guru = user ? user.guru : null;

  const [absensiList, setAbsensiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSesi, setSelectedSesi] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("Fetching absensi for:", { guruId: guru?.id, month: month + 1, year });
      const res = await getSesiAbsensi({
        guru_id: guru?.id,
        month: month + 1,
        year,
      });
      setAbsensiList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Map tanggal -> sesi
  const sesiByDate = {};
  absensiList.forEach(sesi => {
    const tgl = new Date(sesi.jam_mulai).toDateString();
    sesiByDate[tgl] = sesi;
  });

  // Generate calendar days
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // mulai Senin

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getStatusColor = (status) => {
  switch (status) {
    case "valid":          return "#22c55e";
    case "terlambat":      return "#f59e0b"; // ✅ tambah
    case "invalid":        return "#ef4444";
    case "izin":
    case "cuti":           return "#3b82f6";
    case "izin_terlambat": return "#f59e0b";
    case "belum_selesai":  return "#8b5cf6";
    default:               return null;
  }
};

 const getStatusLabel = (status) => {
  const map = {
    valid:           "Hadir",
    terlambat:       "Terlambat", // ✅ tambah
    invalid:         "Alpha",
    izin:            "Izin",
    cuti:            "Cuti",
    izin_terlambat:  "Terlambat",
    belum_selesai:   "Belum Pulang",
  };
  return map[status] || status;
};

  const stats = {
  hadir:     absensiList.filter(s => ["valid", "terlambat"].includes(s.status)).length,
  terlambat: absensiList.filter(s => ["terlambat", "izin_terlambat"].includes(s.status)).length,
  izin:      absensiList.filter(s => ["izin", "cuti"].includes(s.status)).length,
  alpha:     absensiList.filter(s => s.status === "invalid").length,
  totalJam:  absensiList
    .filter(s => ["valid", "terlambat"].includes(s.status)) // ✅ hitung jam terlambat juga
    .reduce((sum, s) => sum + (parseFloat(s.total_jam) || 0), 0)
    .toFixed(1),
};

  const formatJam = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-";

  const formatDurasi = (menit) => {
    if (!menit) return "-";
    return `${Math.floor(menit / 60)} jam ${menit % 60} menit`;
  };

  const monthNames = ["Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"];
  const dayNames = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];

  const today = new Date();

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>

      {/* Header */}
      <div
        className="rounded-3 p-4 mb-4 text-white"
        style={{ background: "linear-gradient(135deg, #3c75ca 0%, #143361 100%)" }}
      >
        <h4 className="mb-1 fw-bold">
          <ClockHistory size={22} className="me-2" />
          Riwayat Absensi
        </h4>
        <p className="mb-0 opacity-90">{guru?.nama}</p>
      </div>

      {/* Stats */}
      <Row className="g-3 mb-4">
        {[
          { label: "Hadir", value: stats.hadir, color: "#22c55e", bg: "#f0fdf4" },
          { label: "Izin/Cuti", value: stats.izin, color: "#3b82f6", bg: "#eff6ff" },
          { label: "Terlambat", value: stats.terlambat, color: "#f59e0b", bg: "#fffbeb" },
          { label: "Alpha", value: stats.alpha, color: "#ef4444", bg: "#fff1f2" },
          { label: "Total Jam", value: `${stats.totalJam}j`, color: "#8b5cf6", bg: "#f5f3ff" },
        ].map(({ label, value, color, bg }) => (
          <Col key={label} lg={2} md={4} xs={6}>
            <Card className="border-0 shadow-sm text-center h-100">
              <Card.Body className="py-3">
                <h4 className="fw-bold mb-0" style={{ color }}>{value}</h4>
                <small className="text-muted">{label}</small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Kalender */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          {/* Navigation */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <button
              className="btn btn-light btn-sm"
              onClick={prevMonth}
            >
              <ChevronLeft size={18} />
            </button>
            <h5 className="fw-bold mb-0">
              {monthNames[month]} {year}
            </h5>
            <button
              className="btn btn-light btn-sm"
              onClick={nextMonth}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              {/* Day Headers */}
              <Row className="g-0 mb-1">
                {dayNames.map(d => (
                  <Col key={d} className="text-center">
                    <small
                      className="fw-bold"
                      style={{ color: d === "Min" || d === "Sab" ? "#ef4444" : "#6b7280" }}
                    >
                      {d}
                    </small>
                  </Col>
                ))}
              </Row>

              {/* Calendar Grid */}
              {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIdx) => (
                <Row key={weekIdx} className="g-1 mb-1">
                  {calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
                    if (!day) return <Col key={dayIdx} />;

                    const dateObj = new Date(year, month, day);
                    const sesi = sesiByDate[dateObj.toDateString()];
                    const isToday = dateObj.toDateString() === today.toDateString();
                    const isWeekend = dayIdx === 5 || dayIdx === 6; // Sab, Min
                    const statusColor = sesi ? getStatusColor(sesi.status) : null;

                    return (
                      <Col key={dayIdx}>
                        <div
                          onClick={() => {
                            if (sesi) {
                              setSelectedSesi(sesi);
                              setShowDetail(true);
                            }
                          }}
                          style={{
                            borderRadius: 10,
                            padding: "6px 4px",
                            textAlign: "center",
                            cursor: sesi ? "pointer" : "default",
                            backgroundColor: isToday ? "#3c75ca" : "transparent",
                            border: isToday ? "none" : "1px solid #e5e7eb",
                            minHeight: 56,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s",
                          }}
                          className={sesi ? "calendar-day-hover" : ""}
                        >
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: isToday ? 700 : 400,
                              color: isToday ? "#fff"
                                : isWeekend ? "#ef4444"
                                : "#374151",
                            }}
                          >
                            {day}
                          </span>
                          {statusColor && (
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: statusColor,
                                marginTop: 4,
                              }}
                            />
                          )}
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              ))}
            </>
          )}

          {/* Legend */}
          <div className="d-flex flex-wrap gap-3 mt-4 pt-3 border-top">
            {[
              { color: "#22c55e", label: "Hadir" },
              { color: "#3b82f6", label: "Izin/Cuti" },
              { color: "#f59e0b", label: "Terlambat" },
              { color: "#ef4444", label: "Alpha" },
              { color: "#8b5cf6", label: "Belum Pulang" },
            ].map(({ color, label }) => (
              <div key={label} className="d-flex align-items-center gap-2">
                <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color }} />
                <small className="text-muted">{label}</small>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Detail Modal */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16 }}>
            Detail Absensi
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSesi && (
            <>
              {/* Status Header */}
              <div
                className="rounded-3 p-3 mb-3 text-white text-center"
                style={{ backgroundColor: getStatusColor(selectedSesi.status) }}
              >
                <h5 className="mb-0 fw-bold">{getStatusLabel(selectedSesi.status)}</h5>
                <small>
                  {new Date(selectedSesi.jam_mulai).toLocaleDateString("id-ID", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric"
                  })}
                </small>
              </div>

              {/* Info */}
              <Table borderless size="sm">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: "40%" }}>Jam Masuk</td>
                    <td className="fw-semibold">: {formatJam(selectedSesi.jam_mulai)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Jam Pulang</td>
                    <td className="fw-semibold">: {selectedSesi.jam_selesai ? formatJam(selectedSesi.jam_selesai) : "-"}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Durasi</td>
                    <td className="fw-semibold">: {formatDurasi(selectedSesi.durasi_menit)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Total Jam</td>
                    <td className="fw-semibold">: {selectedSesi.total_jam ? `${selectedSesi.total_jam} jam` : "-"}</td>
                  </tr>
                  {selectedSesi.catatan_admin && (
                    <tr>
                      <td className="text-muted">Catatan Admin</td>
                      <td className="fw-semibold">: {selectedSesi.catatan_admin}</td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Foto absensi */}
              {selectedSesi.absensi?.length > 0 && (
                <>
                  <hr />
                  <p className="fw-semibold mb-2">Foto Absensi</p>
                  <Row className="g-2">
                    {selectedSesi.absensi.map(a => (
                      a.foto_bukti && (
                        <Col key={a.id} xs={6}>
                          <p className="text-muted mb-1" style={{ fontSize: 12 }}>
                            {a.status === "masuk" ? "📥 Masuk" : "📤 Pulang"}
                          </p>
                          <img
                            src={a.foto_bukti}
                            alt="Foto absensi"
                            className="w-100 rounded-2"
                            style={{ height: 140, objectFit: "cover" }}
                            onError={e => e.target.style.display = "none"}
                          />
                        </Col>
                      )
                    ))}
                  </Row>
                </>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        .calendar-day-hover:hover {
          background-color: #eff6ff !important;
          transform: scale(1.05);
        }
      `}</style>
    </Container>
  );
}