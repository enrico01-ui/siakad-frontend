import { useState, useEffect, useCallback } from "react";
import {
  Container, Row, Col, Card, Table, Badge, Button,
  Form, InputGroup, Modal, Spinner, Tabs, Tab, Alert
} from "react-bootstrap";
import {
  Search, Calendar, Clock, CheckCircle, XCircle,
  ClockHistory, Download, Eye, FileEarmarkPdf,
  People, Printer
} from "react-bootstrap-icons";
import { MapPin } from "lucide-react";
import {
  getAbsensi,
  getAbsensiById,
  getSesiAbsensi,
  getSesiAbsensiById,
  closeSesiAbsensi,
  generateLaporanPDF,
  generateLaporanBulanan,
  getHariLibur
} from "../../services/absensiApi";
import { getSemester } from "../../services/semesterApi";


// =====================
// HOLIDAY HELPER
// =====================
const fetchHariLiburNasional = async (month, year) => {
    try {
        const response = await getHariLibur(month, year);
        console.log("Hari libur nasional:", response.data.data);
        return response.data.data || [];
    } catch (err) {
        console.warn("Gagal fetch hari libur:", err.message);
        return []; // fallback kosong
    }
};

const isWeekend = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};
const totalWeekendInMonth = (month, year) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (isWeekend(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`)) count++;
  }
  return count;
};
// Hitung jumlah hari kerja dalam sebulan (exclude weekend + libur nasional)
const hitungHariKerja = (month, year, hariLibur = []) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (!isWeekend(dateStr) && !hariLibur.includes(dateStr)) count++;
  }
  return count;
};



/**
 * Derive status tampilan dari data sesi + absensi masuk
 * Returns: 'hadir' | 'terlambat' | 'sakit' | 'cuti' | 'tidak_hadir'
 */
const deriveStatusTampilan = (sesi) => {
  switch (sesi.status) {
    case "valid":       return "hadir";
    case "terlambat":   return "terlambat";  // ✅ status baru dari backend
    case "izin_terlambat":
    case "izin terlambat": return "terlambat";
    case "izin":        return "sakit";
    case "cuti":        return "cuti";
    case "invalid":     return "tidak_hadir";
    case "belum_selesai": return "belum_selesai";
    default:            return "tidak_hadir";
  }
};

const StatusBadge = ({ statusTampilan }) => {
  const map = {
    hadir: { bg: "success", label: "Hadir" },
    terlambat: { bg: "warning", label: "Terlambat" },
    sakit: { bg: "info", label: "Sakit/Izin" },
    cuti: { bg: "primary", label: "Cuti" },
    tidak_hadir: { bg: "danger", label: "Tidak Hadir" },
    belum_selesai: { bg: "secondary", label: "Belum Selesai" },
  };
  const s = map[statusTampilan] || { bg: "secondary", label: statusTampilan };
  return <Badge bg={s.bg}>{s.label}</Badge>;
};

// =====================
// FORMAT HELPERS
// =====================
const getBulanNama = (bulan) => {
  const names = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return names[parseInt(bulan) - 1] || "";
};

const formatTime = (time) => {
  if (!time) return "-";
  
  // Jika input sudah berupa format "HH:mm:ss" atau sejenisnya
  if (typeof time === "string" && time.includes(":") && !time.includes("T")) {
    return time.substring(0, 5);
  }

  try {
    const date = new Date(time);
    // Validasi apakah string tanggal valid sebelum di-render
    if (isNaN(date.getTime())) return "-";
    
    return date.toLocaleTimeString("id-ID", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false ,
      timeZone: "Asia/Jakarta",
    }).replace(".", ":"); // Memastikan format jam Indonesia menggunakan titik dua
  } catch (e) {
    return "-";
  }
};

const formatDuration = (minutes) => {
  if (!minutes) return "-";
  return `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
};

const formatDurasiJam = (menit) => {
  if (!menit || menit === 0) return "0j 0m";
  return `${Math.floor(menit / 60)}j ${menit % 60}m`;
};

// =====================
// MAIN COMPONENT
// =====================
export default function AbsensiGuru() {
  const [activeTab, setActiveTab] = useState("absensi");
  const [loading, setLoading] = useState(true);
  const [absensiData, setAbsensiData] = useState([]);
  const [sesiData, setSesiData] = useState([]);
  const [rekapData, setRekapData] = useState([]);
  const [semesterList, setSemesterList] = useState([]);
  const [semesterAktif, setSemesterAktif] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [hariLibur, setHariLibur] = useState([]);
  const [hariKerja, setHariKerja] = useState(0);

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSesiDetailModal, setShowSesiDetailModal] = useState(false);
  const [showCloseSesiModal, setShowCloseSesiModal] = useState(false);
  const [showRekapDetailModal, setShowRekapDetailModal] = useState(false);
  const [selectedAbsensi, setSelectedAbsensi] = useState(null);
  const [selectedSesi, setSelectedSesi] = useState(null);
  const [selectedGuru, setSelectedGuru] = useState(null);
  const [sesiAbsensiList, setSesiAbsensiList] = useState([]);
  const [closeSesiNote, setCloseSesiNote] = useState("");

  // Load holiday data when month/year changes
  useEffect(() => {
    const loadHolidays = async () => {
      const libur = await fetchHariLiburNasional(selectedMonth, selectedYear);
      setHariLibur(libur);
      setHariKerja(hitungHariKerja(selectedMonth, selectedYear, libur));
    };
    loadHolidays();
  }, [selectedMonth, selectedYear]);

  useEffect(() => { loadSemester(); }, []);

  useEffect(() => {
    if (activeTab === "absensi") loadAbsensi();
    else if (activeTab === "sesi") loadSesiAbsensi();
    else if (activeTab === "laporan") loadRekapBulanan();
  }, [activeTab, selectedDate, filterSemester, filterStatus, selectedMonth, selectedYear]);

  const loadSemester = async () => {
    try {
      const response = await getSemester();
      setSemesterList(response.data || []);
      const aktif = response.data.find((s) => s.is_aktif);
      setSemesterAktif(aktif);
      if (aktif) setFilterSemester(aktif.id.toString());
    } catch (error) {
      console.error("Error loading semester:", error);
    }
  };

  const loadAbsensi = async () => {
    try {
      setLoading(true);
      const response = await getAbsensi();
      let filtered = response.data || [];
      if (selectedDate) filtered = filtered.filter((item) => new Date(item.tanggal).toISOString().split("T")[0] === selectedDate);
      if (filterSemester !== "all") filtered = filtered.filter((item) => item.semester_id === parseInt(filterSemester));
      if (filterStatus !== "all") filtered = filtered.filter((item) => item.status === filterStatus);
      setAbsensiData(filtered);
    } catch (error) {
      console.error("Error loading absensi:", error);
      alert("Gagal memuat data absensi!");
    } finally {
      setLoading(false);
    }
  };

  const loadSesiAbsensi = async () => {
    try {
      setLoading(true);
      const response = await getSesiAbsensi();
      let filtered = response.data || [];
      console.log("Sesi absensi:", filtered);
      if (filterSemester !== "all") filtered = filtered.filter((item) => item.semester_id === parseInt(filterSemester));

      console.log("Sesi setelah filter semester:", filtered);
      setSesiData(filtered);
    } catch (error) {
      console.error("Error loading sesi:", error);
      alert("Gagal memuat data sesi!");
    } finally {
      setLoading(false);
    }
  };

  const loadRekapBulanan = async () => {
    try {
      setLoading(true);
      const [sesiResponse, libur] = await Promise.all([
        getSesiAbsensi(),
        fetchHariLiburNasional(selectedMonth, selectedYear),
      ]);

      setHariLibur(libur);
      const totalHariKerja = hitungHariKerja(selectedMonth, selectedYear, libur);
      setHariKerja(totalHariKerja);

      let allSesi = sesiResponse.data || sesiResponse.data || [];
      console.log("Semua sesi untuk rekap bulanan:", allSesi);
      // Filter: exclude weekend & libur nasional
      const filtered = allSesi.filter((item) => {
        const tanggal = new Date(item.jam_mulai).toISOString().split("T")[0];
        const itemDate = new Date(item.jam_mulai);
        const itemMonth = itemDate.getMonth() + 1;
        const itemYear = itemDate.getFullYear();

        const matchSemester = filterSemester === "all" || item.semester_id === parseInt(filterSemester);
        const matchMonth = itemMonth === parseInt(selectedMonth);
        const matchYear = itemYear === parseInt(selectedYear);
        const isHariLibur = libur.includes(tanggal);
        const isLiburMingguan = isWeekend(tanggal);

        return matchSemester && matchMonth && matchYear && !isHariLibur && !isLiburMingguan;
      });
      console.log("Sesi setelah filter untuk rekap bulanan:", filtered);
      // Group by guru
      const rekapByGuru = {};
      filtered.forEach((sesi) => {
        const guruId = sesi.guru_id;
        if (!rekapByGuru[guruId]) {
          rekapByGuru[guruId] = {
            guru: sesi.guru,
            totalHadir: 0,
            totalTerlambat: 0,
            totalSakit: 0,
            totalCuti: 0,
            totalTidakHadir: 0,
            totalBelumSelesai: 0,
            totalJamKerja: 0,
            totalHariKerja,
            sesiList: [],
          };
        }

        const statusTampilan = deriveStatusTampilan(sesi);
        rekapByGuru[guruId].sesiList.push({ ...sesi, statusTampilan });

        switch (statusTampilan) {
          case "hadir": rekapByGuru[guruId].totalHadir++; break;
          case "terlambat": rekapByGuru[guruId].totalTerlambat++; rekapByGuru[guruId].totalHadir++; break;
          case "sakit": rekapByGuru[guruId].totalSakit++; break;
          case "cuti": rekapByGuru[guruId].totalCuti++; break;
          case "tidak_hadir": rekapByGuru[guruId].totalTidakHadir++; break;
          case "belum_selesai": rekapByGuru[guruId].totalBelumSelesai++; break;
        }

        if (sesi.durasi_menit && sesi.durasi_menit > 0) {
          rekapByGuru[guruId].totalJamKerja += sesi.durasi_menit;
        }
      });
      console.log("Rekap per guru:", rekapByGuru);
      setRekapData(Object.values(rekapByGuru));
    } catch (error) {
      console.error("Error loading rekap:", error);
      alert("Gagal memuat rekap bulanan!");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (absensi) => {
    try {
      setLoading(true);
      const response = await getAbsensiById(absensi.id);
      setSelectedAbsensi(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error(error);
      alert("Gagal memuat detail absensi!");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSesiDetail = async (sesi) => {
    try {
      setLoading(true);
      const response = await getSesiAbsensiById(sesi.id);
      setSelectedSesi(response.data);
      setSesiAbsensiList(response.data.absensi || []);
      setShowSesiDetailModal(true);
    } catch (error) {
      console.error(error);
      alert("Gagal memuat detail sesi absensi!");
    } finally {
      setLoading(false);
    }
  };

  const handleViewRekapDetail = (guruRekap) => {
    setSelectedGuru(guruRekap);
    setShowRekapDetailModal(true);
  };

  const handleCloseSesi = async () => {
    if (!selectedSesi || !closeSesiNote.trim()) {
      alert("Catatan admin harus diisi!");
      return;
    }
    try {
      setLoading(true);
      await closeSesiAbsensi(selectedSesi.id, { catatan_admin: closeSesiNote });
      alert("Sesi berhasil ditutup secara manual!");
      setShowCloseSesiModal(false);
      setCloseSesiNote("");
      loadSesiAbsensi();
      if (showSesiDetailModal) handleViewSesiDetail(selectedSesi);
    } catch (error) {
      console.error(error);
      alert("Gagal menutup sesi!");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!selectedSesi) return;
    generateLaporanPDF(selectedSesi.id)
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Laporan_Absensi_Sesi_${selectedSesi.id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => alert("Gagal menghasilkan laporan PDF!"));
  };

  const handleGeneratePDFBulanan = async () => {
    try {
        setLoading(true);
        const response = await generateLaporanBulanan(
            selectedMonth,
            selectedYear,
            filterSemester !== "all" ? filterSemester : null
        );
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Laporan_Absensi_${getBulanNama(selectedMonth)}_${selectedYear}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error(err);
        alert("Gagal generate PDF bulanan!");
    } finally {
        setLoading(false);
    }
};

  const getAbsensiStatusBadge = (status) => {
    const map = { masuk: ["info", "Masuk"], pulang: ["success", "Pulang"], izin: ["warning", "Izin"] };
    const [bg, label] = map[status] || ["secondary", status || "-"];
    return <Badge bg={bg}>{label}</Badge>;
  };

  const getSesiStatusBadge = (status) => {
  const map = {
    belum_selesai:   ["warning",   "Belum Selesai"],
    valid:           ["success",   "Valid"],
    terlambat:       ["warning",   "Terlambat"],      // ✅ tambah
    manual_close:    ["info",      "Manual Close"],
    invalid:         ["danger",    "Tidak Hadir"],
    izin:            ["primary",   "Sakit/Izin"],
    cuti:            ["secondary", "Cuti"],
    izin_terlambat:  ["warning",   "Izin Terlambat"],
    "izin terlambat":["warning",   "Izin Terlambat"],
  };
  const [bg, label] = map[status] || ["secondary", status || "-"];
  return <Badge bg={bg}>{label}</Badge>;
};

  // Stats
  const filteredAbsensi = absensiData.filter(
    (a) => a.guru?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || a.guru?.nip?.includes(searchTerm)
  );
  const filteredSesi = sesiData.filter(
    (s) => s.guru?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || s.guru?.nip?.includes(searchTerm)
  );
  const filteredRekap = rekapData.filter(
    (r) => r.guru?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) || r.guru?.nip?.includes(searchTerm)
  );

  const stats = {
    masuk: absensiData.filter((a) => a.status === "masuk").length,
    pulang: absensiData.filter((a) => a.status === "pulang").length,
    izin: absensiData.filter((a) => a.status === "izin").length,
    total: absensiData.length,
  };

  const sesiStats = {
  valid:       sesiData.filter(s => s.status === "valid").length,
  terlambat:   sesiData.filter(s => s.status === "terlambat").length,  // ✅ tambah
  belumSelesai: sesiData.filter(s => s.status === "belum_selesai").length,
  invalid:     sesiData.filter(s => s.status === "invalid").length,
  izin:        sesiData.filter(s => ["izin", "izin_terlambat", "izin terlambat"].includes(s.status)).length,
  cuti:        sesiData.filter(s => s.status === "cuti").length,
};

  const rekapStats = {
    totalGuru: rekapData.length,
    totalHadir: rekapData.reduce((s, r) => s + r.totalHadir, 0),
    totalTerlambat: rekapData.reduce((s, r) => s + r.totalTerlambat, 0),
    totalSakit: rekapData.reduce((s, r) => s + r.totalSakit, 0),
    totalCuti: rekapData.reduce((s, r) => s + r.totalCuti, 0),
    totalTidakHadir: rekapData.reduce((s, r) => s + r.totalTidakHadir, 0),
    totalJamKerja: rekapData.reduce((s, r) => s + r.totalJamKerja, 0),
  };

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <h2 className="mb-4 fw-bold">Absensi Guru</h2>

      {semesterAktif && (
        <Alert variant="info" className="mb-3 no-print">
          <strong>Semester Aktif:</strong> {semesterAktif.nama} - {semesterAktif.tahun_ajaran}
        </Alert>
      )}

      {/* ── STATS ABSENSI ── */}
      {activeTab === "absensi" && (
        <Row className="g-3 mb-4 no-print">
          {[
            { label: "Foto Masuk", value: stats.masuk, color: "info", Icon: Clock },
            { label: "Foto Pulang", value: stats.pulang, color: "success", Icon: CheckCircle },
            { label: "Permintaan Izin", value: stats.izin, color: "warning", Icon: ClockHistory },
            { label: "Total Absensi", value: stats.total, color: "primary", Icon: People },
          ].map(({ label, value, color, Icon }) => (
            <Col lg={3} md={6} key={label}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">{label}</p>
                      <h3 className={`mb-0 fw-bold text-${color}`}>{value}</h3>
                    </div>
                    <div className={`bg-${color} bg-opacity-10 p-3 rounded-3`}>
                      <Icon size={28} className={`text-${color}`} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ── STATS SESI ── */}
      {activeTab === "sesi" && (
        <Row className="g-3 mb-4 no-print">
          {[
            { label: "Valid (Hadir)", value: sesiStats.valid, color: "success", Icon: CheckCircle },
            { label: "Terlambat", value: sesiStats.terlambat, color: "warning", Icon: Clock },
            { label: "Belum Selesai", value: sesiStats.belumSelesai, color: "warning", Icon: Clock },
            { label: "Tidak Hadir", value: sesiStats.invalid, color: "danger", Icon: XCircle },
            { label: "Sakit/Izin", value: sesiStats.izin, color: "primary", Icon: ClockHistory },
            { label: "Cuti", value: sesiStats.cuti, color: "secondary", Icon: Calendar },
          ].map(({ label, value, color, Icon }) => (
            <Col key={label}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">{label}</p>
                      <h3 className={`mb-0 fw-bold text-${color}`}>{value}</h3>
                    </div>
                    <div className={`bg-${color} bg-opacity-10 p-3 rounded-3`}>
                      <Icon size={28} className={`text-${color}`} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ── STATS LAPORAN ── */}
      {activeTab === "laporan" && (
        <Row className="g-3 mb-4 no-print">
          {[
            { label: "Total Guru", value: rekapStats.totalGuru, color: "primary", Icon: People },
            { label: "Hadir", value: rekapStats.totalHadir, color: "success", Icon: CheckCircle },
            { label: "Terlambat", value: rekapStats.totalTerlambat, color: "warning", Icon: Clock },
            { label: "Sakit/Izin", value: rekapStats.totalSakit, color: "info", Icon: ClockHistory },
            { label: "Cuti", value: rekapStats.totalCuti, color: "secondary", Icon: Calendar },
            { label: "Tidak Hadir", value: rekapStats.totalTidakHadir, color: "danger", Icon: XCircle },
          ].map(({ label, value, color, Icon }) => (
            <Col key={label}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted mb-1 small">{label}</p>
                      <h3 className={`mb-0 fw-bold text-${color}`}>{value}</h3>
                    </div>
                    <div className={`bg-${color} bg-opacity-10 p-3 rounded-3`}>
                      <Icon size={24} className={`text-${color}`} />
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ── MAIN CARD ── */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3 no-print">
            <Tab eventKey="absensi" title={<><Calendar className="me-2" />Foto Absensi</>} />
            <Tab eventKey="sesi" title={<><ClockHistory className="me-2" />Sesi Kehadiran</>} />
            <Tab eventKey="laporan" title={<><FileEarmarkPdf className="me-2" />Laporan Bulanan</>} />
          </Tabs>

          {/* ── FILTERS ── */}
          <Row className="mb-3 no-print">
            <Col md={activeTab === "laporan" ? 3 : 4}>
              <InputGroup>
                <InputGroup.Text><Search size={18} /></InputGroup.Text>
                <Form.Control
                  placeholder="Cari nama atau NIP guru..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>

            {activeTab === "absensi" && (
              <>
                <Col md={3}>
                  <Form.Control type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </Col>
                <Col md={2}>
                  <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">Semua Status</option>
                    <option value="masuk">Masuk</option>
                    <option value="pulang">Pulang</option>
                    <option value="izin">Izin</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
                    <option value="all">Semua Semester</option>
                    {semesterList.map((sem) => (
                      <option key={sem.id} value={sem.id}>{sem.nama} - {sem.tahun_ajaran}</option>
                    ))}
                  </Form.Select>
                </Col>
              </>
            )}

            {activeTab === "sesi" && (
              <Col md={4}>
                <Form.Select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
                  <option value="all">Semua Semester</option>
                  {semesterList.map((sem) => (
                    <option key={sem.id} value={sem.id}>{sem.nama} - {sem.tahun_ajaran}</option>
                  ))}
                </Form.Select>
              </Col>
            )}

            {activeTab === "laporan" && (
              <>
                <Col md={2}>
                  <Form.Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                      <option key={m} value={m}>{getBulanNama(m)}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={1}>
                  <Form.Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    {[2023,2024,2025,2026,2027].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
                    <option value="all">Semua Semester</option>
                    {semesterList.map((sem) => (
                      <option key={sem.id} value={sem.id}>{sem.nama} - {sem.tahun_ajaran}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2} className="d-flex align-items-center">
                  <small className="text-muted">
                    <strong>{hariKerja}</strong> hari kerja
                    {hariLibur.length > 0 && <span className="text-info"> ({hariLibur.length} libur nasional)</span>}
                  </small>
                </Col>
                <Col md={2} className="text-end">
                  <Button variant="danger" onClick={handleGeneratePDFBulanan} disabled={loading || rekapData.length === 0}>
                    <Printer size={16} className="me-2" />
                    Download PDF
                  </Button>
                </Col>
              </>
            )}
          </Row>

          {/* ── CONTENT ── */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Memuat data...</p>
            </div>
          ) : activeTab === "absensi" ? (
            <TableAbsensi data={filteredAbsensi} onViewDetail={handleViewDetail} getStatusBadge={getAbsensiStatusBadge} />
          ) : activeTab === "sesi" ? (
            <TableSesi data={filteredSesi} onViewDetail={handleViewSesiDetail} />
          ) : (
            <div id="printable-rekap">
              <TableLaporanBulanan
                data={filteredRekap}
                month={selectedMonth}
                year={selectedYear}
                semester={semesterList.find((s) => s.id === parseInt(filterSemester))}
                hariKerja={hariKerja}
                hariLibur={hariLibur}
                onViewDetail={handleViewRekapDetail}
              />
            </div>
          )}
        </Card.Body>
      </Card>

      {/* ── MODAL DETAIL ABSENSI ── */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detail Foto Absensi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAbsensi && (
            <Row>
              <Col md={6}>
                <h6 className="fw-bold mb-3">Informasi Guru</h6>
                <Table borderless size="sm">
                  <tbody>
                    <tr><td className="text-muted">Nama</td><td>: {selectedAbsensi.guru?.nama || "-"}</td></tr>
                    <tr><td className="text-muted">NIP</td><td>: {selectedAbsensi.guru?.nip || "-"}</td></tr>
                    <tr><td className="text-muted">Peran</td><td>: {selectedAbsensi.guru?.peran || "-"}</td></tr>
                  </tbody>
                </Table>
                <h6 className="fw-bold mb-3 mt-4">Informasi Absensi</h6>
                <Table borderless size="sm">
                  <tbody>
                    <tr>
                      <td className="text-muted">Tanggal</td>
                      <td>: {new Date(selectedAbsensi.tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</td>
                    </tr>
                    <tr><td className="text-muted">Jam</td><td>: {selectedAbsensi.jam || "-"}</td></tr>
                    <tr><td className="text-muted">Status</td><td>{getAbsensiStatusBadge(selectedAbsensi.status)}</td></tr>
                    <tr><td className="text-muted">Semester</td><td>: {selectedAbsensi.semester?.nama || "-"}</td></tr>
                  </tbody>
                </Table>
                {selectedAbsensi.latitude && selectedAbsensi.longitude && (
                  <>
                    <h6 className="fw-bold mb-3 mt-4">Lokasi Absensi</h6>
                    <Button size="sm" variant="outline-primary" className="w-100" as="a"
                      href={`https://www.google.com/maps?q=${selectedAbsensi.latitude},${selectedAbsensi.longitude}`} target="_blank">
                      <MapPin size={14} className="me-1" /> Lihat di Google Maps
                    </Button>
                  </>
                )}
              </Col>
              <Col md={6}>
                <h6 className="fw-bold mb-3">{selectedAbsensi.status === "izin" ? "Bukti Izin" : "Foto Bukti"}</h6>
                <div className="border rounded p-2">
                  {selectedAbsensi.foto_bukti ? (
                    <img src={`${selectedAbsensi.foto_bukti}`}
                      alt="Foto Bukti" className="img-fluid rounded"
                      style={{ maxHeight: "400px", width: "100%", objectFit: "contain" }}
                      onError={(e) => { e.target.src = "https://via.placeholder.com/400x500?text=Foto+Tidak+Tersedia"; }}
                    />
                  ) : (
                    <div className="text-center text-muted py-5">
                      <People size={48} className="mb-2" /><p>Tidak ada foto bukti</p>
                    </div>
                  )}
                </div>
                {selectedAbsensi.foto_bukti && (
                  <Button variant="outline-primary" size="sm" className="w-100 mt-2" as="a"
                    href={`${selectedAbsensi.foto_bukti}`} target="_blank">
                    <Download size={16} className="me-1" /> Download Foto
                  </Button>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Tutup</Button>
        </Modal.Footer>
      </Modal>

      {/* ── MODAL SESI DETAIL ── */}
      <Modal show={showSesiDetailModal} onHide={() => setShowSesiDetailModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Detail Sesi Kehadiran</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSesi && (
            <>
              <Card className="bg-light border-0 mb-3">
                <Card.Body>
                  <Row>
                    <Col md={3}>
                      <p className="mb-1"><strong>Guru:</strong><br />{selectedSesi.guru?.nama || "-"}</p>
                      <p className="mb-1"><strong>NIP:</strong> {selectedSesi.guru?.nip || "-"}</p>
                    </Col>
                    <Col md={3}>
                      <p className="mb-1"><strong>Tanggal:</strong><br />{new Date(selectedSesi.created_at).toLocaleDateString("id-ID")}</p>
                      <p className="mb-1"><strong>Semester:</strong> {selectedSesi.semester?.nama || "-"}</p>
                    </Col>
                    <Col md={3}>
                      <p className="mb-1"><strong>Jam Masuk:</strong> {formatTime(selectedSesi.jam_mulai)}</p>
                      <p className="mb-1"><strong>Jam Keluar:</strong> {formatTime(selectedSesi.jam_selesai) || "Belum keluar"}</p>
                    </Col>
                    <Col md={3}>
                      <p className="mb-1"><strong>Durasi:</strong> {formatDuration(selectedSesi.durasi_menit)}</p>
                      <p className="mb-1"><strong>Status:</strong> <StatusBadge statusTampilan={deriveStatusTampilan(selectedSesi)} /></p>
                    </Col>
                    {selectedSesi.catatan_admin && (
                      <Col md={12} className="mt-2">
                        <Alert variant="info" className="mb-0"><strong>Catatan Admin:</strong> {selectedSesi.catatan_admin}</Alert>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Riwayat Foto ({sesiAbsensiList.length})</h6>
                {selectedSesi.status === "belum_selesai" && (
                  <Button size="sm" variant="warning" onClick={() => setShowCloseSesiModal(true)}>
                    <XCircle size={14} className="me-1" /> Tutup Sesi Manual
                  </Button>
                )}
              </div>

              <Table hover responsive size="sm">
                <thead className="table-light">
                  <tr><th>No</th><th>Jam</th><th>Status</th><th>Foto Bukti</th><th>Lokasi</th></tr>
                </thead>
                <tbody>
                  {sesiAbsensiList.length > 0 ? sesiAbsensiList.map((absensi, i) => (
                    <tr key={absensi.id}>
                      <td>{i + 1}</td>
                      <td>{absensi.jam || "-"}</td>
                      <td>{getAbsensiStatusBadge(absensi.status)}</td>
                      <td>
                        {absensi.foto_bukti ? (
                          <Button size="sm" variant="outline-primary" as="a"
                            href={`${absensi.foto_bukti}`} target="_blank">
                            <Eye size={12} className="me-1" /> Lihat
                          </Button>
                        ) : <span className="text-muted">-</span>}
                      </td>
                      <td>
                        {absensi.latitude && absensi.longitude ? (
                          <Button size="sm" variant="outline-secondary" as="a"
                            href={`https://www.google.com/maps?q=${absensi.latitude},${absensi.longitude}`} target="_blank">
                            <MapPin size={12} />
                          </Button>
                        ) : <span className="text-muted">-</span>}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="text-center text-muted py-3">Tidak ada data foto absensi</td></tr>
                  )}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSesiDetailModal(false)}>Tutup</Button>
        </Modal.Footer>
      </Modal>

      {/* ── MODAL CLOSE SESI ── */}
      <Modal show={showCloseSesiModal} onHide={() => setShowCloseSesiModal(false)}>
        <Modal.Header closeButton><Modal.Title>Tutup Sesi Manual</Modal.Title></Modal.Header>
        <Modal.Body>
          <Alert variant="warning"><strong>Perhatian!</strong> Sesi akan ditutup secara manual.</Alert>
          <Form.Group>
            <Form.Label>Catatan Admin <span className="text-danger">*</span></Form.Label>
            <Form.Control as="textarea" rows={3} value={closeSesiNote}
              onChange={(e) => setCloseSesiNote(e.target.value)} placeholder="Masukkan alasan penutupan..." />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCloseSesiModal(false)}>Batal</Button>
          <Button variant="warning" onClick={handleCloseSesi} disabled={!closeSesiNote.trim() || loading}>
            {loading ? "Memproses..." : "Tutup Sesi"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── MODAL REKAP DETAIL ── */}
      <Modal show={showRekapDetailModal} onHide={() => setShowRekapDetailModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>Detail Kehadiran Bulanan</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedGuru && (
            <>
              <Card className="bg-light border-0 mb-3">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p className="mb-1"><strong>Nama:</strong> {selectedGuru.guru?.nama}</p>
                      <p className="mb-1"><strong>NIP:</strong> {selectedGuru.guru?.nip || "-"}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1"><strong>Periode:</strong> {getBulanNama(selectedMonth)} {selectedYear}</p>
                      <p className="mb-1"><strong>Hari Kerja:</strong> {selectedGuru.totalHariKerja} hari</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Table bordered size="sm" className="mb-3">
                <thead className="table-light">
                  <tr><th>Status</th><th className="text-center">Jumlah</th></tr>
                </thead>
                <tbody>
                  <tr><td><Badge bg="success">Hadir</Badge></td><td className="text-center fw-bold">{selectedGuru.totalHadir}</td></tr>
                  <tr><td><Badge bg="warning">Terlambat</Badge></td><td className="text-center fw-bold">{selectedGuru.totalTerlambat}</td></tr>
                  <tr><td><Badge bg="info">Sakit/Izin</Badge></td><td className="text-center fw-bold">{selectedGuru.totalSakit}</td></tr>
                  <tr><td><Badge bg="primary">Cuti</Badge></td><td className="text-center fw-bold">{selectedGuru.totalCuti}</td></tr>
                  <tr><td><Badge bg="danger">Tidak Hadir</Badge></td><td className="text-center fw-bold">{selectedGuru.totalTidakHadir}</td></tr>
                  <tr><td><Badge bg="secondary">Belum Selesai</Badge></td><td className="text-center fw-bold">{selectedGuru.totalBelumSelesai}</td></tr>
                </tbody>
              </Table>

              <h6 className="fw-bold mb-3">Riwayat Sesi</h6>
              <Table hover size="sm">
                <thead className="table-light">
                  <tr><th>Tanggal</th><th>Jam Masuk</th><th>Jam Keluar</th><th>Durasi</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {selectedGuru.sesiList?.map((sesi) => (
                    <tr key={sesi.id}>
                      <td>{new Date(sesi.jam_mulai).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}</td>
                      <td>{formatTime(sesi.jam_mulai)}</td>
                      <td>{formatTime(sesi.jam_selesai) || "-"}</td>
                      <td>{formatDuration(sesi.durasi_menit)}</td>
                      <td><StatusBadge statusTampilan={sesi.statusTampilan || deriveStatusTampilan(sesi)} /></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRekapDetailModal(false)}>Tutup</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
      `}</style>
    </Container>
  );

  // helper inside component scope for modal
  // function getAbsensiStatusBadge(status) {
  //   const map = { masuk: ["info","Masuk"], pulang: ["success","Pulang"], izin: ["warning","Izin"] };
  //   const [bg, label] = map[status] || ["secondary", status || "-"];
  //   return <Badge bg={bg}>{label}</Badge>;
  // }
}

// =====================
// TABLE: ABSENSI
// =====================
function TableAbsensi({ data, onViewDetail }) {
  const getStatusBadge = (status) => {
    const map = { masuk: ["info","Masuk"], pulang: ["success","Pulang"], izin: ["warning","Izin"] };
    const [bg, label] = map[status] || ["secondary", status || "-"];
    return <Badge bg={bg}>{label}</Badge>;
  };

  return (
    <Table hover responsive>
      <thead className="table-light">
        <tr>
          <th>Tanggal</th><th>Nama Guru</th><th>NIP</th><th>Jam</th>
          <th>Status</th><th>Semester</th><th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? data.map((absensi) => (
          <tr key={absensi.id}>
            <td>{new Date(absensi.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
            <td className="fw-medium">{absensi.guru?.nama || "-"}</td>
            <td>{absensi.guru?.nip || "-"}</td>
            <td>{absensi.jam || "-"}</td>
            <td>{getStatusBadge(absensi.status)}</td>
            <td><Badge bg="secondary">{absensi.semester?.nama || "-"}</Badge></td>
            <td>
              <Button size="sm" variant="outline-primary" onClick={() => onViewDetail(absensi)}>
                <Eye size={14} className="me-1" /> Detail
              </Button>
            </td>
          </tr>
        )) : (
          <tr><td colSpan="7" className="text-center text-muted py-4">Tidak ada data absensi</td></tr>
        )}
      </tbody>
    </Table>
  );
}

// =====================
// TABLE: SESI
// =====================
function TableSesi({ data, onViewDetail }) {
  return (
    <Table hover responsive>
      <thead className="table-light">
        <tr>
          <th>Tanggal</th><th>Guru</th><th>NIP</th><th>Jam Masuk</th>
          <th>Jam Keluar</th><th>Durasi</th><th>Semester</th><th>Status</th><th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? data.map((sesi) => {
          const statusTampilan = deriveStatusTampilan(sesi);
          return (
            <tr key={sesi.id}>
              <td>{new Date(sesi.jam_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
              <td className="fw-medium">{sesi.guru?.nama || "-"}</td>
              <td>{sesi.guru?.nip || "-"}</td>
              <td>{formatTime(sesi.jam_mulai)}</td>
              <td>{formatTime(sesi.jam_selesai) || <span className="text-muted">Belum keluar</span>}</td>
              <td>{sesi.durasi_menit} menit</td>
              <td><Badge bg="secondary">{sesi.semester?.nama || "-"}</Badge></td>
              <td><StatusBadge statusTampilan={statusTampilan} /></td>
              <td>
                <Button size="sm" variant="outline-primary" onClick={() => onViewDetail(sesi)}>
                  <Eye size={14} className="me-1" /> Detail
                </Button>
              </td>
            </tr>
          );
        }) : (
          <tr><td colSpan="9" className="text-center text-muted py-4">Tidak ada data sesi</td></tr>
        )}
      </tbody>
    </Table>
  );
}

// =====================
// TABLE: LAPORAN BULANAN
// =====================
function TableLaporanBulanan({ data, month, year, semester, hariKerja, hariLibur, onViewDetail }) {
  return (
    <>
      <div className="d-none d-print-block mb-4 text-center">
        <h3>LAPORAN KEHADIRAN GURU</h3>
        <h5>{getBulanNama(month)} {year}</h5>
        {semester && <p>Semester: {semester.nama} - {semester.tahun_ajaran}</p>}
        <p>Jumlah Hari Kerja: {hariKerja} hari (sudah dikurangi {hariLibur.length} libur nasional & weekend)</p>
      </div>

      <Alert variant="light" className="border mb-3 no-print" style={{ fontSize: "0.85rem" }}>
        📅 <strong>Hari Kerja Bulan {getBulanNama(month)} {year}:</strong> {hariKerja} hari
        {hariLibur.length > 0 && (
          <span className="text-info ms-2">({hariLibur.length} hari libur nasional & {totalWeekendInMonth(month, year)} hari weekend dikecualikan)</span>
        )}
      </Alert>

      <Table hover responsive bordered>
        <thead className="table-light">
          <tr>
            <th className="text-center" rowSpan="2">No</th>
            <th rowSpan="2">Nama Guru</th>
            <th rowSpan="2">NIP</th>
            <th className="text-center" rowSpan="2">Hari Kerja</th>
            <th className="text-center" colSpan="5">Rekapitulasi Kehadiran</th>
            <th className="text-center" rowSpan="2">Total Jam</th>
            <th className="text-center" rowSpan="2">Avg/Hari</th>
            <th className="text-center" rowSpan="2">% Hadir</th>
            <th className="text-center" rowSpan="2">Aksi</th>
          </tr>
          <tr>
            <th className="text-center bg-success bg-opacity-10">✅ Hadir</th>
            <th className="text-center bg-warning bg-opacity-10">⏰ Terlambat</th>
            <th className="text-center bg-info bg-opacity-10">🤒 Sakit/Izin</th>
            <th className="text-center bg-primary bg-opacity-10">🏖️ Cuti</th>
            <th className="text-center bg-danger bg-opacity-10">❌ Tidak Hadir</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map((rekap, index) => {
            // Persentase hadir = (hadir + terlambat) / hariKerja * 100
            // Terlambat dihitung hadir tapi diberi catatan
            const hariEfektif = rekap.totalHariKerja || hariKerja;
            const totalMasuk = rekap.totalHadir;
            const persentase = hariEfektif > 0 ? ((totalMasuk / hariEfektif) * 100).toFixed(1) : 0;
            const avgJam = rekap.totalHadir > 0 ? rekap.totalJamKerja / rekap.totalHadir : 0;
            console.log(`Guru: ${rekap.guru?.nama}, Hari Kerja: ${hariEfektif}, Hadir: ${rekap.totalHadir}, Terlambat: ${rekap.totalTerlambat}, % Hadir: ${persentase}%`);
            return (
              <tr key={index}>
                <td className="text-center">{index + 1}</td>
                <td className="fw-medium">{rekap.guru?.nama || "-"}</td>
                <td>{rekap.guru?.nip || "-"}</td>
                <td className="text-center fw-bold">{hariEfektif}</td>
                <td className="text-center text-success fw-bold">{rekap.totalHadir}</td>
                <td className="text-center fw-bold" style={{ color: "#e67e22" }}>{rekap.totalTerlambat}</td>
                <td className="text-center text-info fw-bold">{rekap.totalSakit}</td>
                <td className="text-center text-primary fw-bold">{rekap.totalCuti}</td>
                <td className="text-center text-danger fw-bold">{rekap.totalTidakHadir}</td>
                <td className="text-center" style={{ fontSize: "0.82rem" }}>{formatDurasiJam(rekap.totalJamKerja)}</td>
                <td className="text-center" style={{ fontSize: "0.82rem" }}>{formatDurasiJam(Math.round(avgJam))}</td>
                <td className="text-center">
                  <Badge bg={persentase >= 90 ? "success" : persentase >= 75 ? "warning" : "danger"}>
                    {persentase}%
                  </Badge>
                </td>
                <td className="text-center">
                  <Button size="sm" variant="outline-primary" onClick={() => onViewDetail(rekap)}>
                    <Eye size={14} className="me-1" /> Detail
                  </Button>
                </td>
              </tr>
            );
          }) : (
            <tr><td colSpan="14" className="text-center text-muted py-4">Tidak ada data rekap</td></tr>
          )}
        </tbody>
        {data.length > 0 && (
          <tfoot className="table-secondary fw-bold">
            <tr>
              <td colSpan="3" className="text-center">TOTAL</td>
              <td className="text-center">{hariKerja}</td>
              <td className="text-center text-success">{data.reduce((s, r) => s + r.totalHadir, 0)}</td>
              <td className="text-center" style={{ color: "#e67e22" }}>{data.reduce((s, r) => s + r.totalTerlambat, 0)}</td>
              <td className="text-center text-info">{data.reduce((s, r) => s + r.totalSakit, 0)}</td>
              <td className="text-center text-primary">{data.reduce((s, r) => s + r.totalCuti, 0)}</td>
              <td className="text-center text-danger">{data.reduce((s, r) => s + r.totalTidakHadir, 0)}</td>
              <td className="text-center">{formatDurasiJam(data.reduce((s, r) => s + r.totalJamKerja, 0))}</td>
              <td className="text-center">-</td>
              <td className="text-center">
                <Badge bg="success">
                  {(() => {
                    const totalMasuk = data.reduce((s, r) => s + r.totalHadir + r.totalTerlambat, 0);
                    const totalHK = hariKerja * data.length;
                    return totalHK > 0 ? ((totalMasuk / totalHK) * 100).toFixed(1) : 0;
                  })()}%
                </Badge>
              </td>
              <td></td>
            </tr>
          </tfoot>
        )}
      </Table>

      <div className="alert alert-warning mt-3 no-print" style={{ fontSize: "0.85rem" }}>
        <strong>Keterangan:</strong>
        <ul className="mb-0 mt-1">
          <li><strong>✅ Hadir:</strong> Absen masuk & pulang lengkap sebelum 07:31</li>
          <li><strong>⏰ Terlambat:</strong> Absen masuk setelah 07:31 (dihitung hadir dalam persentase)</li>
          <li><strong>🤒 Sakit/Izin:</strong> Status izin disetujui admin</li>
          <li><strong>🏖️ Cuti:</strong> Status cuti</li>
          <li><strong>❌ Tidak Hadir:</strong> Tidak absen atau sesi tidak valid (alpha)</li>
          <li><strong>% Hadir:</strong> (Hadir + Terlambat) ÷ Hari Kerja × 100 <em>(weekend & libur nasional dikecualikan otomatis)</em></li>
        </ul>
      </div>
    </>
  );
}