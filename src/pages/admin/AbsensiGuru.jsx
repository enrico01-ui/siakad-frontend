import { useState, useEffect } from "react";
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
  generateLaporanBulanan
} from "../../services/absensiApi";
import { getSemester } from "../../services/semesterApi";

export default function AbsensiGuru() {
  const [activeTab, setActiveTab] = useState("absensi");
  const [loading, setLoading] = useState(true);
  const [absensiData, setAbsensiData] = useState([]);
  const [sesiData, setSesiData] = useState([]);
  const [rekapData, setRekapData] = useState([]);
  const [semesterList, setSemesterList] = useState([]);
  const [semesterAktif, setSemesterAktif] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
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

  useEffect(() => {
    loadSemester();
  }, []);

  useEffect(() => {
    if (activeTab === "absensi") {
      loadAbsensi();
    } else if (activeTab === "sesi") {
      loadSesiAbsensi();
    } else if (activeTab === "laporan") {
      loadRekapBulanan();
    }
  }, [activeTab, selectedDate, filterSemester, filterStatus, selectedMonth, selectedYear]);

  const loadSemester = async () => {
    try {
      const response = await getSemester();
      setSemesterList(response.data || []);
      const aktif = response.data.find(s => s.is_aktif);
      setSemesterAktif(aktif);
      if (aktif) {
        setFilterSemester(aktif.id.toString());
      }
    } catch (error) {
      console.error("Error loading semester:", error);
    }
  };

  const loadAbsensi = async () => {
    try {
      setLoading(true);
      const response = await getAbsensi();
      let filtered = response.data || [];

      if (selectedDate) {
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.tanggal).toISOString().split('T')[0];
          return itemDate === selectedDate;
        });
      }

      if (filterSemester !== "all") {
        filtered = filtered.filter(item => item.semester_id === parseInt(filterSemester));
      }

      if (filterStatus !== "all") {
        filtered = filtered.filter(item => item.status === filterStatus);
      }

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

      if (filterSemester !== "all") {
        filtered = filtered.filter(item => item.semester_id === parseInt(filterSemester));
      }

      setSesiData(filtered);
    } catch (error) {
      console.error("Error loading sesi:", error);
      alert("Gagal memuat data sesi!");
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Load rekap bulanan dari SESI, bukan dari absensi
  // Update function loadRekapBulanan di AbsensiGuru.jsx

const loadRekapBulanan = async () => {
  try {
    setLoading(true);
    
    const response = await getSesiAbsensi();
    let allSesi = response.data || [];

    // Filter by semester, month, year
    const filtered = allSesi.filter(item => {
      const itemDate = new Date(item.created_at);
      const itemMonth = itemDate.getMonth() + 1;
      const itemYear = itemDate.getFullYear();
      
      const matchSemester = filterSemester === "all" || item.semester_id === parseInt(filterSemester);
      const matchMonth = itemMonth === parseInt(selectedMonth);
      const matchYear = itemYear === parseInt(selectedYear);
      
      return matchSemester && matchMonth && matchYear;
    });

    // Group by guru
    const rekapByGuru = {};
    
    filtered.forEach(sesi => {
      const guruId = sesi.guru_id;
      
      if (!rekapByGuru[guruId]) {
        rekapByGuru[guruId] = {
          guru: sesi.guru,
          totalHadir: 0,
          totalIzin: 0,
          totalInvalid: 0,
          totalBelumSelesai: 0,
          totalTerlambat: 0,       // ⭐ BARU
          totalJamKerja: 0,        // ⭐ BARU (dalam menit)
          totalHari: 0,
          sesiList: []
        };
      }
      
      rekapByGuru[guruId].sesiList.push(sesi);
      rekapByGuru[guruId].totalHari++;
      
      // Count berdasarkan status SESI
      switch(sesi.status) {
        case 'valid':
          rekapByGuru[guruId].totalHadir++;
          break;
        case 'izin':
          rekapByGuru[guruId].totalIzin++;
          break;
        case 'invalid':
          rekapByGuru[guruId].totalInvalid++;
          break;
        case 'belum_selesai':
          rekapByGuru[guruId].totalBelumSelesai++;
          break;
      }

      // ⭐ HITUNG KETERLAMBATAN
      // Cari absensi masuk di sesi ini
      if (sesi.absensi && Array.isArray(sesi.absensi)) {
        const absensiMasuk = sesi.absensi.find(a => a.status === 'masuk');
        
        if (absensiMasuk && absensiMasuk.jam) {
          // Parse jam masuk
          const jamMasuk = absensiMasuk.jam; // Format: "HH:MM:SS" atau "HH:MM"
          const [hour, minute] = jamMasuk.split(':').map(Number);
          
          // Batas waktu: 07:31
          const batasHour = 7;
          const batasMenit = 31;
          
          // Cek terlambat
          if (hour > batasHour || (hour === batasHour && minute > batasMenit)) {
            rekapByGuru[guruId].totalTerlambat++;
          }
        }
      }

      // ⭐ HITUNG TOTAL JAM KERJA
      if (sesi.durasi_menit && sesi.durasi_menit > 0) {
        rekapByGuru[guruId].totalJamKerja += sesi.durasi_menit;
      }
    });

    setRekapData(Object.values(rekapByGuru));
  } catch (error) {
    console.error("Error loading rekap:", error);
    alert("Gagal memuat rekap bulanan!");
  } finally {
    setLoading(false);
  }
};

  // FIXED: handleViewDetail tidak error lagi
  const handleViewDetail = async (absensi) => {
    try {
      setLoading(true);
      const response = await getAbsensiById(absensi.id);
      setSelectedAbsensi(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error loading detail:", error);
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
      console.error("Error loading sesi detail:", error);
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
      if (showSesiDetailModal) {
        handleViewSesiDetail(selectedSesi);
      }
    } catch (error) {
      console.error("Error closing sesi:", error);
      alert("Gagal menutup sesi!");
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Generate PDF dengan parameter yang benar
  const handleGeneratePDF = () => {
    if (!selectedSesi) return;
    
    generateLaporanPDF(selectedSesi.id)
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Laporan_Absensi_Sesi_${selectedSesi.id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(error => {
        console.error("Error generating PDF:", error);
        alert("Gagal menghasilkan laporan PDF!");
      });
  };

  // FIXED: Generate PDF Bulanan
  const handleGeneratePDFBulanan = async () => {
  try {
    setLoading(true);
    
    
    const response = await generateLaporanBulanan();
    
    // Create blob dan download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Absensi_${getBulanNama(selectedMonth)}_${selectedYear}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Gagal generate PDF bulanan!');
  } finally {
    setLoading(false);
  }
};

  const getAbsensiStatusBadge = (status) => {
    switch(status) {
      case 'masuk':
        return <Badge bg="info">Masuk</Badge>;
      case 'keluar':
        return <Badge bg="success">Keluar</Badge>;
      case 'izin':
        return <Badge bg="warning">Izin</Badge>;
      default:
        return <Badge bg="secondary">{status || '-'}</Badge>;
    }
  };

  const getSesiStatusBadge = (status) => {
    switch(status) {
      case 'belum_selesai':
        return <Badge bg="warning">Belum Selesai</Badge>;
      case 'valid':
        return <Badge bg="success">Valid (Hadir)</Badge>;
      case 'manual_close':
        return <Badge bg="info">Manual Close</Badge>;
      case 'invalid':
        return <Badge bg="danger">Invalid (Alpha)</Badge>;
      case 'izin':
        return <Badge bg="primary">Izin</Badge>;
      default:
        return <Badge bg="secondary">{status || '-'}</Badge>;
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}j ${mins}m`;
  };

  const formatTime = (time) => {
    if (!time) return '-';
    if (typeof time === 'string' && time.includes(':')) {
      return time.substring(0, 5);
    }
    return new Date(time).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getBulanNama = (bulan) => {
    const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return namaBulan[parseInt(bulan) - 1] || '';
  };

  const filteredAbsensi = absensiData.filter(absensi =>
    absensi.guru?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    absensi.guru?.nip?.includes(searchTerm)
  );

  const filteredSesi = sesiData.filter(sesi =>
    sesi.guru?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sesi.guru?.nip?.includes(searchTerm)
  );

  const filteredRekap = rekapData.filter(rekap =>
    rekap.guru?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rekap.guru?.nip?.includes(searchTerm)
  );

  const stats = {
    masuk: absensiData.filter(a => a.status === 'masuk').length,
    keluar: absensiData.filter(a => a.status === 'keluar').length,
    izin: absensiData.filter(a => a.status === 'izin').length,
    total: absensiData.length
  };

  const sesiStats = {
    valid: sesiData.filter(s => s.status === 'valid').length,
    belumSelesai: sesiData.filter(s => s.status === 'belum_selesai').length,
    invalid: sesiData.filter(s => s.status === 'invalid').length,
    izin: sesiData.filter(s => s.status === 'izin').length,
  };

  
  const rekapStats = {
  totalGuru: rekapData.length,
  totalHadir: rekapData.reduce((sum, r) => sum + r.totalHadir, 0),
  totalIzin: rekapData.reduce((sum, r) => sum + r.totalIzin, 0),
  totalInvalid: rekapData.reduce((sum, r) => sum + r.totalInvalid, 0),
  totalTerlambat: rekapData.reduce((sum, r) => sum + (r.totalTerlambat || 0), 0),  // ⭐ BARU
  totalJamKerja: rekapData.reduce((sum, r) => sum + (r.totalJamKerja || 0), 0),   // ⭐ BARU
};

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <h2 className="mb-4 fw-bold">Absensi Guru</h2>

      {semesterAktif && (
        <Alert variant="info" className="mb-3 no-print">
          <strong>Semester Aktif:</strong> {semesterAktif.nama} - {semesterAktif.tahun_ajaran}
        </Alert>
      )}

      {/* Stats Cards */}
      {activeTab === "absensi" && (
        <Row className="g-3 mb-4 no-print">
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Foto Masuk</p>
                    <h3 className="mb-0 fw-bold text-info">{stats.masuk}</h3>
                  </div>
                  <div className="bg-info bg-opacity-10 p-3 rounded-3">
                    <Clock size={28} className="text-info" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Foto Keluar</p>
                    <h3 className="mb-0 fw-bold text-success">{stats.keluar}</h3>
                  </div>
                  <div className="bg-success bg-opacity-10 p-3 rounded-3">
                    <CheckCircle size={28} className="text-success" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Permintaan Izin</p>
                    <h3 className="mb-0 fw-bold text-warning">{stats.izin}</h3>
                  </div>
                  <div className="bg-warning bg-opacity-10 p-3 rounded-3">
                    <ClockHistory size={28} className="text-warning" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Total Absensi</p>
                    <h3 className="mb-0 fw-bold text-primary">{stats.total}</h3>
                  </div>
                  <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                    <People size={28} className="text-primary" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === "sesi" && (
        <Row className="g-3 mb-4 no-print">
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Valid (Hadir)</p>
                    <h3 className="mb-0 fw-bold text-success">{sesiStats.valid}</h3>
                  </div>
                  <div className="bg-success bg-opacity-10 p-3 rounded-3">
                    <CheckCircle size={28} className="text-success" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Belum Selesai</p>
                    <h3 className="mb-0 fw-bold text-warning">{sesiStats.belumSelesai}</h3>
                  </div>
                  <div className="bg-warning bg-opacity-10 p-3 rounded-3">
                    <Clock size={28} className="text-warning" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Invalid (Alpha)</p>
                    <h3 className="mb-0 fw-bold text-danger">{sesiStats.invalid}</h3>
                  </div>
                  <div className="bg-danger bg-opacity-10 p-3 rounded-3">
                    <XCircle size={28} className="text-danger" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Izin</p>
                    <h3 className="mb-0 fw-bold text-primary">{sesiStats.izin}</h3>
                  </div>
                  <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                    <ClockHistory size={28} className="text-primary" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      
{activeTab === "laporan" && (
  <Row className="g-3 mb-4 no-print">
    <Col lg={2} md={4}>
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted mb-1 small">Total Guru</p>
              <h3 className="mb-0 fw-bold text-primary">{rekapStats.totalGuru}</h3>
            </div>
            <div className="bg-primary bg-opacity-10 p-3 rounded-3">
              <People size={28} className="text-primary" />
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
    <Col lg={2} md={4}>
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted mb-1 small">Total Hadir</p>
              <h3 className="mb-0 fw-bold text-success">{rekapStats.totalHadir}</h3>
            </div>
            <div className="bg-success bg-opacity-10 p-3 rounded-3">
              <CheckCircle size={28} className="text-success" />
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
    <Col lg={2} md={4}>
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted mb-1 small">Total Terlambat</p>
              <h3 className="mb-0 fw-bold text-warning">{rekapStats.totalTerlambat}</h3>
            </div>
            <div className="bg-warning bg-opacity-10 p-3 rounded-3">
              <Clock size={28} className="text-warning" />
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
    <Col lg={2} md={4}>
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted mb-1 small">Total Izin</p>
              <h3 className="mb-0 fw-bold text-info">{rekapStats.totalIzin}</h3>
            </div>
            <div className="bg-info bg-opacity-10 p-3 rounded-3">
              <ClockHistory size={28} className="text-info" />
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
    <Col lg={2} md={4}>
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted mb-1 small">Total Alpha</p>
              <h3 className="mb-0 fw-bold text-danger">{rekapStats.totalInvalid}</h3>
            </div>
            <div className="bg-danger bg-opacity-10 p-3 rounded-3">
              <XCircle size={28} className="text-danger" />
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
    <Col lg={2} md={4}>
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex flex-column">
            <p className="text-muted mb-1 small">Total Jam Kerja</p>
            <h6 className="mb-0 fw-bold text-dark">
              {(() => {
                const jam = Math.floor(rekapStats.totalJamKerja / 60);
                const menit = rekapStats.totalJamKerja % 60;
                return `${jam}j ${menit}m`;
              })()}
            </h6>
          </div>
        </Card.Body>
      </Card>
    </Col>
  </Row>
)}

      {/* Main Card */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3 no-print"
          >
            <Tab eventKey="absensi" title={
              <>
                <Calendar className="me-2" />
                Foto Absensi
              </>
            } />
            <Tab eventKey="sesi" title={
              <>
                <ClockHistory className="me-2" />
                Sesi Kehadiran
              </>
            } />
            <Tab eventKey="laporan" title={
              <>
                <FileEarmarkPdf className="me-2" />
                Laporan Bulanan
              </>
            } />
          </Tabs>

          {/* Filters */}
          <Row className="mb-3 no-print">
            <Col md={activeTab === "laporan" ? 3 : 4}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={18} />
                </InputGroup.Text>
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
                  <Form.Control
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </Col>
                <Col md={2}>
                  <Form.Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">Semua Status</option>
                    <option value="masuk">Masuk</option>
                    <option value="keluar">Keluar</option>
                    <option value="izin">Izin</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                  >
                    <option value="all">Semua Semester</option>
                    {semesterList.map(sem => (
                      <option key={sem.id} value={sem.id}>
                        
                        {sem.nama} - {sem.tahun_ajaran}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </>
            )}

            {activeTab === "sesi" && (
              <Col md={4}>
                <Form.Select
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
                >
                  <option value="all">Semua Semester</option>
                  {semesterList.map(sem => (
                    <option key={sem.id} value={sem.id}>
                      {sem.nama} - {sem.tahun_ajaran}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            )}

            {activeTab === "laporan" && (
              <>
                <Col md={2}>
                  <Form.Select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>{getBulanNama(m)}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {[2023, 2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                  >
                    <option value="all">Semua Semester</option>
                    {semesterList.map(sem => (
                      <option key={sem.id} value={sem.id}>
                        {sem.nama} - {sem.tahun_ajaran}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3} className="text-end">
                  <Button 
                    variant="danger" 
                    onClick={handleGeneratePDFBulanan}
                    disabled={loading || rekapData.length === 0}
                  >
                    <Printer size={16} className="me-2" />
                    Download PDF
                  </Button>
                </Col>
              </>
            )}
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Memuat data...</p>
            </div>
          ) : activeTab === "absensi" ? (
            <TableAbsensi 
              data={filteredAbsensi} 
              onViewDetail={handleViewDetail}
            />
          ) : activeTab === "sesi" ? (
            <TableSesi 
              data={filteredSesi} 
              onViewDetail={handleViewSesiDetail}
            />
          ) : (
            <div id="printable-rekap">
              <TableLaporanBulanan
                data={filteredRekap}
                month={selectedMonth}
                year={selectedYear}
                semester={semesterList.find(s => s.id === parseInt(filterSemester))}
                onViewDetail={handleViewRekapDetail}
              />
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Detail Absensi Modal */}
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
                    <tr>
                      <td className="text-muted">Nama</td>
                      <td className="fw-medium">: {selectedAbsensi.guru?.nama || '-'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">NIP</td>
                      <td className="fw-medium">: {selectedAbsensi.guru?.nip || '-'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Peran</td>
                      <td className="fw-medium">: {selectedAbsensi.guru?.peran || '-'}</td>
                    </tr>
                  </tbody>
                </Table>

                <h6 className="fw-bold mb-3 mt-4">Informasi Absensi</h6>
                <Table borderless size="sm">
                  <tbody>
                    <tr>
                      <td className="text-muted">Tanggal</td>
                      <td className="fw-medium">
                        : {new Date(selectedAbsensi.tanggal).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Jam</td>
                      <td className="fw-medium">: {selectedAbsensi.jam || '-'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Status</td>
                      <td>{getAbsensiStatusBadge(selectedAbsensi.status)}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Semester</td>
                      <td className="fw-medium">: {selectedAbsensi.semester?.nama || '-'}</td>
                    </tr>
                    {selectedAbsensi.sesi && (
                      <tr>
                        <td className="text-muted">Sesi</td>
                        <td>
                          <Badge bg="secondary">
                            Sesi #{selectedAbsensi.sesi.id} - {getSesiStatusBadge(selectedAbsensi.sesi.status)}
                          </Badge>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>

                {selectedAbsensi.latitude && selectedAbsensi.longitude && (
                  <>
                    <h6 className="fw-bold mb-3 mt-4">Lokasi Absensi</h6>
                    <div className="border rounded p-2 mb-2">
                      <p className="mb-1 small">
                        <strong>Koordinat:</strong><br />
                        Lat: {selectedAbsensi.latitude}<br />
                        Long: {selectedAbsensi.longitude}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="w-100"
                      as="a"
                      href={`https://www.google.com/maps?q=${selectedAbsensi.latitude},${selectedAbsensi.longitude}`}
                      target="_blank"
                    >
                      <MapPin size={14} className="me-1" />
                      Lihat di Google Maps
                    </Button>
                  </>
                )}
              </Col>

              <Col md={6}>
                <h6 className="fw-bold mb-3">
                  {selectedAbsensi.status === 'izin' ? 'Bukti Izin' : 'Foto Bukti'}
                </h6>
                <div className="border rounded p-2">
                  {selectedAbsensi.foto_bukti ? (
                    <img 
                      src={selectedAbsensi.foto_bukti}
                      alt={selectedAbsensi.status === 'izin' ? 'Bukti Izin' : 'Foto Bukti Absensi'} 
                      className="img-fluid rounded"
                      style={{ maxHeight: '400px', width: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x500/e3f2fd/1976d2?text=Foto+Tidak+Tersedia';
                      }}
                    />
                  ) : (
                    <div className="text-center text-muted py-5">
                      <People size={48} className="mb-2" />
                      <p className="mb-0">Tidak ada foto bukti</p>
                    </div>
                  )}
                </div>
                {selectedAbsensi.foto_bukti && (
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="w-100 mt-2"
                    as="a"
                    href={selectedAbsensi.foto_bukti}
                    target="_blank"
                  >
                    <Download size={16} className="me-1" />
                    Download {selectedAbsensi.status === 'izin' ? 'Bukti Izin' : 'Foto'}
                  </Button>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Sesi Detail Modal */}
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
                      <p className="mb-1"><strong>Guru:</strong><br />{selectedSesi.guru?.nama || '-'}</p>
                      <p className="mb-1"><strong>NIP:</strong> {selectedSesi.guru?.nip || '-'}</p>
                    </Col>
                    <Col md={3}>
                      <p className="mb-1"><strong>Tanggal:</strong><br />
                        {new Date(selectedSesi.created_at).toLocaleDateString('id-ID')}
                      </p>
                      <p className="mb-1"><strong>Semester:</strong> {selectedSesi.semester?.nama || '-'}</p>
                    </Col>
                    <Col md={3}>
                      <p className="mb-1"><strong>Jam Masuk:</strong> {formatTime(selectedSesi.jam_mulai)}</p>
                      <p className="mb-1"><strong>Jam Keluar:</strong> {formatTime(selectedSesi.jam_selesai) || 'Belum foto keluar'}</p>
                    </Col>
                    <Col md={3}>
                      <p className="mb-1"><strong>Durasi:</strong> {formatDuration(selectedSesi.durasi_menit)}</p>
                      <p className="mb-1"><strong>Total Jam:</strong> {selectedSesi.total_jam ? `${selectedSesi.total_jam} jam` : '-'}</p>
                      <p className="mb-1"><strong>Status:</strong> {getSesiStatusBadge(selectedSesi.status)}</p>
                    </Col>
                    {selectedSesi.catatan_admin && (
                      <Col md={12} className="mt-2">
                        <Alert variant="info" className="mb-0">
                          <strong>Catatan Admin:</strong> {selectedSesi.catatan_admin}
                        </Alert>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Riwayat Foto ({sesiAbsensiList.length})</h6>
                <div>
                  {selectedSesi.status === 'belum_selesai' && (
                    <Button
                      size="sm"
                      variant="warning"
                      className="me-2"
                      onClick={() => {
                        setShowCloseSesiModal(true);
                      }}
                    >
                      <XCircle size={14} className="me-1" />
                      Tutup Sesi Manual
                    </Button>
                  )}
                  
                </div>
              </div>

              <Table hover responsive size="sm">
                <thead className="table-light">
                  <tr>
                    <th>No</th>
                    <th>Jam</th>
                    <th>Status</th>
                    <th>Foto Bukti</th>
                    <th>Lokasi</th>
                  </tr>
                </thead>
                <tbody>
                  {sesiAbsensiList.length > 0 ? (
                    sesiAbsensiList.map((absensi, index) => (
                      <tr key={absensi.id}>
                        <td>{index + 1}</td>
                        <td>{absensi.jam || '-'}</td>
                        <td>{getAbsensiStatusBadge(absensi.status)}</td>
                        <td>
                          {absensi.foto_bukti ? (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              as="a"
                              href={absensi.foto_bukti}
                              target="_blank"
                            >
                              <Eye size={12} className="me-1" />
                              Lihat
                            </Button>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {absensi.latitude && absensi.longitude ? (
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              as="a"
                              href={`https://www.google.com/maps?q=${absensi.latitude},${absensi.longitude}`}
                              target="_blank"
                            >
                              <MapPin size={12} />
                            </Button>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-3">
                        Tidak ada data foto absensi di sesi ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSesiDetailModal(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Close Sesi Modal */}
      <Modal show={showCloseSesiModal} onHide={() => setShowCloseSesiModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tutup Sesi Manual</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Perhatian!</strong> Anda akan menutup sesi ini secara manual dan mengubah statusnya menjadi "manual_close".
          </Alert>
          <Form.Group>
            <Form.Label>Catatan Admin <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={closeSesiNote}
              onChange={(e) => setCloseSesiNote(e.target.value)}
              placeholder="Masukkan alasan penutupan manual..."
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCloseSesiModal(false)}>
            Batal
          </Button>
          <Button 
            variant="warning" 
            onClick={handleCloseSesi}
            disabled={!closeSesiNote.trim() || loading}
          >
            {loading ? 'Memproses...' : 'Tutup Sesi'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Rekap Detail Modal */}
      <Modal show={showRekapDetailModal} onHide={() => setShowRekapDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detail Kehadiran Bulanan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGuru && (
            <>
              <Card className="bg-light border-0 mb-3">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p className="mb-1"><strong>Nama:</strong> {selectedGuru.guru?.nama}</p>
                      <p className="mb-1"><strong>NIP:</strong> {selectedGuru.guru?.nip || '-'}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1"><strong>Periode:</strong> {getBulanNama(selectedMonth)} {selectedYear}</p>
                      <p className="mb-1"><strong>Total Hari:</strong> {selectedGuru.totalHari} hari</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Table bordered size="sm" className="mb-3">
                <thead className="table-light">
                  <tr>
                    <th>Status</th>
                    <th className="text-center">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><Badge bg="success">Valid (Hadir)</Badge></td>
                    <td className="text-center fw-bold">{selectedGuru.totalHadir}</td>
                  </tr>
                  <tr>
                    <td><Badge bg="primary">Izin</Badge></td>
                    <td className="text-center fw-bold">{selectedGuru.totalIzin}</td>
                  </tr>
                  <tr>
                    <td><Badge bg="danger">Invalid (Alpha)</Badge></td>
                    <td className="text-center fw-bold">{selectedGuru.totalInvalid}</td>
                  </tr>
                  <tr>
                    <td><Badge bg="warning">Belum Selesai</Badge></td>
                    <td className="text-center fw-bold">{selectedGuru.totalBelumSelesai}</td>
                  </tr>
                </tbody>
              </Table>

              <h6 className="fw-bold mb-3">Riwayat Sesi</h6>
              <Table hover size="sm">
                <thead className="table-light">
                  <tr>
                    <th>Tanggal</th>
                    <th>Jam Masuk</th>
                    <th>Jam Keluar</th>
                    <th>Durasi</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGuru.sesiList && selectedGuru.sesiList.map(sesi => (
                    <tr key={sesi.id}>
                      <td>
                        {new Date(sesi.created_at).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td>{formatTime(sesi.jam_mulai)}</td>
                      <td>{formatTime(sesi.jam_selesai) || '-'}</td>
                      <td>{formatDuration(sesi.durasi_menit)}</td>
                      <td>{getSesiStatusBadge(sesi.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRekapDetailModal(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            background: white !important;
          }
          
          .container-fluid {
            padding: 20px !important;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
        }
      `}</style>
    </Container>
  );
}

// Table Components
function TableAbsensi({ data, onViewDetail }) {
  const getAbsensiStatusBadge = (status) => {
    switch(status) {
      case 'masuk': return <Badge bg="info">Masuk</Badge>;
      case 'keluar': return <Badge bg="success">Keluar</Badge>;
      case 'izin': return <Badge bg="warning">Izin</Badge>;
      default: return <Badge bg="secondary">{status || '-'}</Badge>;
    }
  };

  return (
    <Table hover responsive>
      <thead className="table-light">
        <tr>
          <th>Tanggal</th>
          <th>Nama Guru</th>
          <th>NIP</th>
          <th>Jam</th>
          <th>Status</th>
          <th>Semester</th>
          <th>Sesi</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((absensi) => (
            <tr key={absensi.id}>
              <td>
                {new Date(absensi.tanggal).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </td>
              <td className="fw-medium">{absensi.guru?.nama || '-'}</td>
              <td>{absensi.guru?.nip || '-'}</td>
              <td>{absensi.jam || '-'}</td>
              <td>{getAbsensiStatusBadge(absensi.status)}</td>
              <td>
                <Badge bg="secondary">
                  {absensi.semester?.nama || '-'}
                </Badge>
              </td>
              <td>
                {absensi.sesi ? (
                  <Badge bg="primary">
                    Sesi #{absensi.sesi.id}
                  </Badge>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
              <td>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => onViewDetail(absensi)}
                >
                  <Eye size={14} className="me-1" />
                  Detail
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="8" className="text-center text-muted py-4">
              Tidak ada data absensi
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}

function TableSesi({ data, onViewDetail }) {
  const getSesiStatusBadge = (status) => {
    switch(status) {
      case 'belum_selesai': return <Badge bg="warning">Belum Selesai</Badge>;
      case 'valid': return <Badge bg="success">Valid (Hadir)</Badge>;
      case 'manual_close': return <Badge bg="info">Manual Close</Badge>;
      case 'invalid': return <Badge bg="danger">Invalid (Alpha)</Badge>;
      case 'izin': return <Badge bg="primary">Izin</Badge>;
      default: return <Badge bg="secondary">{status || '-'}</Badge>;
    }
  };

  const formatTime = (time) => {
    if (!time) return '-';
    if (typeof time === 'string' && time.includes(':')) {
      return time.substring(0, 5);
    }
    return new Date(time).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}j ${mins}m`;
  };

  return (
    <Table hover responsive>
      <thead className="table-light">
        <tr>
          <th>Tanggal</th>
          <th>Guru</th>
          <th>NIP</th>
          <th>Jam Masuk</th>
          <th>Jam Keluar</th>
          <th>Durasi</th>
          <th>Total Jam</th>
          <th>Semester</th>
          <th>Status</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((sesi) => (
            <tr key={sesi.id}>
              <td>
                {new Date(sesi.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </td>
              <td className="fw-medium">{sesi.guru?.nama || '-'}</td>
              <td>{sesi.guru?.nip || '-'}</td>
              <td>{formatTime(sesi.jam_mulai)}</td>
              <td>{formatTime(sesi.jam_selesai) || 'Belum keluar'}</td>
              <td>{formatDuration(sesi.durasi_menit)}</td>
              <td>{sesi.total_jam ? `${sesi.total_jam} jam` : '-'}</td>
              <td>
                <Badge bg="secondary">
                  {sesi.semester?.nama || '-'}
                </Badge>
              </td>
              <td>{getSesiStatusBadge(sesi.status)}</td>
              <td>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => onViewDetail(sesi)}
                >
                  <Eye size={14} className="me-1" />
                  Detail
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="10" className="text-center text-muted py-4">
              Tidak ada data sesi
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}

// Update TableLaporanBulanan component di AbsensiGuru.jsx

function TableLaporanBulanan({ data, month, year, semester, onViewDetail }) {
  const getBulanNama = (bulan) => {
    const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return namaBulan[parseInt(bulan) - 1] || '';
  };

  // ⭐ Helper untuk format durasi menit ke jam:menit
  const formatDurasiJam = (menit) => {
    if (!menit || menit === 0) return '0 jam 0 menit';
    const jam = Math.floor(menit / 60);
    const mins = menit % 60;
    return `${jam} jam ${mins} menit`;
  };

  return (
    <>
      <div className="d-none d-print-block mb-4 text-center">
        <h3 className="mb-2">LAPORAN KEHADIRAN GURU</h3>
        <h5>{getBulanNama(month)} {year}</h5>
        {semester && <p className="mb-0">Semester: {semester.nama} - {semester.tahun_ajaran}</p>}
      </div>

      <Table hover responsive bordered>
        <thead className="table-light">
          <tr>
            <th className="text-center" rowSpan="2">No</th>
            <th rowSpan="2">Nama Guru</th>
            <th rowSpan="2">NIP</th>
            <th className="text-center" rowSpan="2">Total Hari</th>
            <th className="text-center" colSpan="4">Rekapitulasi</th>
            <th className="text-center bg-warning bg-opacity-10" rowSpan="2">Terlambat</th>
            <th className="text-center" rowSpan="2">Total Jam Kerja</th>
            <th className="text-center" rowSpan="2">Avg Jam/Hari</th>
            <th className="text-center" rowSpan="2">% Hadir</th>
            <th className="text-center" rowSpan="2">Aksi</th>
          </tr>
          <tr>
            <th className="text-center bg-success bg-opacity-10">Hadir</th>
            <th className="text-center bg-primary bg-opacity-10">Izin</th>
            <th className="text-center bg-danger bg-opacity-10">Alpha</th>
            <th className="text-center bg-info bg-opacity-10">Belum Selesai</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((rekap, index) => {
              const persentase = rekap.totalHari > 0 
                ? ((rekap.totalHadir / rekap.totalHari) * 100).toFixed(1)
                : 0;

              // ⭐ Hitung rata-rata jam per hari
              const avgJamPerHari = rekap.totalHadir > 0
                ? rekap.totalJamKerja / rekap.totalHadir
                : 0;
              
              return (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td className="fw-medium">{rekap.guru?.nama || '-'}</td>
                  <td>{rekap.guru?.nip || '-'}</td>
                  <td className="text-center fw-bold">{rekap.totalHari}</td>
                  <td className="text-center text-success fw-bold">{rekap.totalHadir}</td>
                  <td className="text-center text-primary fw-bold">{rekap.totalIzin}</td>
                  <td className="text-center text-danger fw-bold">{rekap.totalInvalid}</td>
                  <td className="text-center text-info fw-bold">{rekap.totalBelumSelesai}</td>
                  <td className="text-center bg-warning bg-opacity-10 fw-bold">
                    {rekap.totalTerlambat || 0}
                  </td>
                  <td className="text-center fw-bold" style={{ fontSize: '0.85rem' }}>
                    {formatDurasiJam(rekap.totalJamKerja)}
                  </td>
                  <td className="text-center" style={{ fontSize: '0.85rem' }}>
                    {formatDurasiJam(avgJamPerHari)}
                  </td>
                  <td className="text-center">
                    <Badge bg={persentase >= 90 ? 'success' : persentase >= 75 ? 'warning' : 'danger'}>
                      {persentase}%
                    </Badge>
                  </td>
                  <td className="text-center">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => onViewDetail(rekap)}
                    >
                      <Eye size={14} className="me-1" />
                      Detail
                    </Button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="13" className="text-center text-muted py-4">
                Tidak ada data rekap
              </td>
            </tr>
          )}
        </tbody>
        {data.length > 0 && (
          <tfoot className="table-secondary fw-bold">
            <tr>
              <td colSpan="3" className="text-center">TOTAL</td>
              <td className="text-center">
                {data.reduce((sum, r) => sum + r.totalHari, 0)}
              </td>
              <td className="text-center text-success">
                {data.reduce((sum, r) => sum + r.totalHadir, 0)}
              </td>
              <td className="text-center text-primary">
                {data.reduce((sum, r) => sum + r.totalIzin, 0)}
              </td>
              <td className="text-center text-danger">
                {data.reduce((sum, r) => sum + r.totalInvalid, 0)}
              </td>
              <td className="text-center text-info">
                {data.reduce((sum, r) => sum + r.totalBelumSelesai, 0)}
              </td>
              <td className="text-center bg-warning bg-opacity-10">
                {data.reduce((sum, r) => sum + (r.totalTerlambat || 0), 0)}
              </td>
              <td className="text-center" style={{ fontSize: '0.85rem' }}>
                {formatDurasiJam(data.reduce((sum, r) => sum + (r.totalJamKerja || 0), 0))}
              </td>
              <td className="text-center">-</td>
              <td className="text-center">
                <Badge bg="success">
                  {(() => {
                    const totalHari = data.reduce((sum, r) => sum + r.totalHari, 0);
                    const totalHadir = data.reduce((sum, r) => sum + r.totalHadir, 0);
                    return totalHari > 0 ? ((totalHadir / totalHari) * 100).toFixed(1) : 0;
                  })()}%
                </Badge>
              </td>
              <td></td>
            </tr>
          </tfoot>
        )}
      </Table>

      {/* ⭐ TAMBAHKAN KETERANGAN */}
      <div className="alert alert-warning mt-3 no-print">
        <strong>Keterangan:</strong>
        <ul className="mb-0 mt-2">
          <li><strong>Hadir:</strong> Guru absen masuk dan keluar lengkap (status: valid)</li>
          <li><strong>Izin:</strong> Guru izin dan disetujui admin</li>
          <li><strong>Alpha:</strong> Guru hanya absen masuk tanpa keluar (status: invalid)</li>
          <li><strong>Terlambat:</strong> Guru masuk lebih dari jam 07:31 WIB</li>
          <li><strong>Total Jam Kerja:</strong> Akumulasi durasi kerja dari semua sesi hadir</li>
          <li><strong>Avg Jam/Hari:</strong> Rata-rata jam kerja per hari hadir</li>
        </ul>
      </div>
    </>
  );
}