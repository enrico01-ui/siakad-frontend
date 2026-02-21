import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Badge, ProgressBar, Spinner } from "react-bootstrap";
import { People, PersonBadge, CashStack, ClipboardCheck, GraphUp } from "react-bootstrap-icons";
import { TrendingUp, TrendingDown } from "lucide-react";

// Import API services
import { getSiswa } from "../../services/siswaApi";
import { getGuru } from "../../services/guruApi";
import { getSpp } from "../../services/sppApi";
import { getSesiAbsensi } from "../../services/absensiApi";
import { getKelas } from "../../services/kelasApi";
import { getSemester } from "../../services/semesterApi";

export default function DashboardAdmin() {
  const [loading, setLoading] = useState(true);
  const [semesterAktif, setSemesterAktif] = useState(null);
  
  // Stats data
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [totalGuru, setTotalGuru] = useState(0);
  const [totalPembayaran, setTotalPembayaran] = useState(0);
  const [persentaseKehadiran, setPersentaseKehadiran] = useState(0);
  
  // Detail data
  const [pembayaranRecent, setPembayaranRecent] = useState([]);
  const [absensiGuru, setAbsensiGuru] = useState([]);
  const [statistikKelas, setStatistikKelas] = useState([]);
  const [kehadiranStats, setKehadiranStats] = useState({ hadir: 0, izin: 0, invalid: 0, total: 0 });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load semester aktif
      const semesterResponse = await getSemester();
      const aktif = semesterResponse.data.find(s => s.is_aktif);
      setSemesterAktif(aktif);

      // Load semua data paralel
      const [siswaRes, guruRes, sppRes, sesiRes, kelasRes] = await Promise.all([
        getSiswa(),
        getGuru(),
        getSpp(),
        getSesiAbsensi(),
        getKelas()
      ]);

      console.log('📊 Data Sesi Absensi:', sesiRes);

      // Process Siswa - filter yang AKTIF
      const siswaAktif = (siswaRes.data || []).filter(s => s.status === 'AKTIF');
      setTotalSiswa(siswaAktif.length);

      // Process Guru
      const allGuru = guruRes.data || [];
      setTotalGuru(allGuru.length);

      // Process SPP - hitung total pembayaran bulan ini yang VERIFIED
      const today = new Date();
      const currentMonth = today.getMonth() + 1; // JavaScript month is 0-indexed
      const currentYear = today.getFullYear();
      
      console.log("📅 Current Month:", currentMonth, "Year:", currentYear);
      console.log("💰 Data SPP yang diterima:", sppRes.data);

      const sppBulanIni = (sppRes.data.data || []).filter(spp => {
        return (
          spp.status === 'DITERIMA' &&
          parseInt(spp.bulan) === currentMonth &&
          parseInt(spp.tahun) === currentYear
        );
      });
      
      console.log("✅ SPP bulan ini (DITERIMA):", sppBulanIni);
      
      const totalSpp = sppBulanIni.reduce((sum, spp) => sum + (parseFloat(spp.jumlah) || 0), 0);
      setTotalPembayaran(totalSpp);

      // Get recent pembayaran (5 terbaru berdasarkan tanggal_verifkasi)
      const recentSpp = (sppRes.data.data || [])
        .filter(spp => spp.tanggal_verifikasi) // Hanya yang sudah diverifikasi
        .sort((a, b) => new Date(b.tanggal_verifikasi) - new Date(a.tanggal_verifikasi))
        .slice(0, 5)
        .map(spp => ({
          id: spp.id,
          nama: spp.siswa?.nama || '-',
          kelas: spp.siswa?.kelas?.nama_kelas || '-',
          bulan: getBulanNama(spp.bulan),
          tahun: spp.tahun,
          jumlah: spp.jumlah || 0,
          status: spp.status,
          tanggal: new Date(spp.tanggal_verifikasi).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          })
        }));
      setPembayaranRecent(recentSpp);

      console.log("💵 Total Pembayaran SPP bulan ini:", totalSpp);
      console.log("📋 Pembayaran SPP terbaru:", recentSpp);

      // ✅ Process Sesi Absensi Guru - hari ini
      const todayStr = today.toISOString().split('T')[0];
      
      console.log("📅 Looking for sesi on date:", todayStr);
      console.log("📊 All Sesi Data:", sesiRes.data);

      // Filter sesi hari ini berdasarkan jam_mulai
      const sesiHariIni = (sesiRes.data  || []).filter(sesi => {
        const sesiDate = new Date(sesi.jam_mulai).toISOString().split('T')[0];
        const isToday = sesiDate === todayStr;
        
        console.log(`🔍 Sesi ID ${sesi.id}:`, {
          jam_mulai: sesi.jam_mulai,
          sesiDate,
          isToday,
          status: sesi.status,
          guru: sesi.guru?.nama
        });
        
        return isToday;
      });

      console.log("✅ Sesi hari ini:", sesiHariIni);

      // Group by guru (ambil sesi terbaru per guru)
      const guruSesiMap = new Map();
      sesiHariIni.forEach(sesi => {
        const guruId = sesi.guru_id;
        if (!guruSesiMap.has(guruId) || 
            new Date(sesi.jam_mulai) > new Date(guruSesiMap.get(guruId).jam_mulai)) {
          guruSesiMap.set(guruId, sesi);
        }
      });

      console.log("👥 Guru Sesi Map:", guruSesiMap);

      // Convert to array untuk display
      const absensiList = Array.from(guruSesiMap.values()).map(sesi => {
        return {
          id: sesi.id,
          nama: sesi.guru?.nama || '-',
          peran: sesi.guru?.peran || 'Guru',
          status: sesi.status, // valid | izin | invalid | izin_terlambat | belum_selesai
          waktu: sesi.jam_mulai ? new Date(sesi.jam_mulai).toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : '-',
          jam_selesai: sesi.jam_selesai ? new Date(sesi.jam_selesai).toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : '-',
          durasi: sesi.total_jam ? `${sesi.total_jam} jam` : '-'
        };
      });

      console.log("📋 Absensi List untuk display:", absensiList);

      setAbsensiGuru(absensiList.slice(0, 10)); // Ambil 10 teratas

      // Hitung statistik kehadiran
      const hadir = absensiList.filter(a => a.status === 'valid').length;
      const izin = absensiList.filter(a => a.status === 'izin' || a.status === 'izin_terlambat').length;
      const invalid = absensiList.filter(a => a.status === 'invalid').length;
      const totalAbsen = absensiList.length;
      
      // Persentase dari total guru yang sudah absen
      const persentase = totalAbsen > 0 ? ((hadir / totalAbsen) * 100).toFixed(1) : 0;
      
      setPersentaseKehadiran(persentase);
      setKehadiranStats({ 
        hadir, 
        izin, 
        invalid, 
        total: totalAbsen,
        totalGuru: allGuru.length 
      });

      console.log("📊 Kehadiran Stats:", { hadir, izin, invalid, totalAbsen, persentase });

      // Process Statistik Kelas
      const kelasData = kelasRes.data || [];
      const kelasStats = kelasData.reduce((acc, kelas) => {
        const nama_kelas = kelas.nama_kelas.split('-')[0].trim(); // Ambil bagian sebelum '-'
        if (!acc[nama_kelas]) {
          acc[nama_kelas] = {
            tingkat: `Kelas ${nama_kelas}`,
            jumlah: 0,
            rombel: 0
          };
        }
        acc[nama_kelas].jumlah += kelas.siswa?.length || 0;
        acc[nama_kelas].rombel += 1;
        return acc;
      }, {});

      const finalKelasStats = Object.values(kelasStats);
      console.log("📊 Statistik Kelas:", finalKelasStats);
      
      setStatistikKelas(finalKelasStats);

    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBulanNama = (bulan) => {
    const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return namaBulan[parseInt(bulan) - 1] || bulan;
  };

  const getStatusBadgeVariant = (status) => {
    switch(status?.toLowerCase()) {
      case 'valid': return 'success';
      case 'izin': return 'warning';
      case 'izin_terlambat': return 'info';
      case 'invalid': return 'danger';
      case 'belum_selesai': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch(status?.toLowerCase()) {
      case 'valid': return 'HADIR';
      case 'izin': return 'IZIN';
      case 'izin_terlambat': return 'IZIN TERLAMBAT';
      case 'invalid': return 'TIDAK VALID';
      case 'belum_selesai': return 'BELUM SELESAI';
      default: return status?.toUpperCase() || '-';
    }
  };

  const statsCards = [
    { 
      id: 1,
      title: "Total Siswa", 
      value: totalSiswa.toLocaleString('id-ID'),
      subtitle: "Siswa Aktif",
      trend: "up",
      icon: People, 
      color: "#3b82f6",
      bgColor: "#eff6ff"
    },
    { 
      id: 2,
      title: "Total Guru", 
      value: totalGuru.toLocaleString('id-ID'),
      subtitle: "Tenaga Pengajar",
      trend: "up",
      icon: PersonBadge, 
      color: "#10b981",
      bgColor: "#f0fdf4"
    },
    { 
      id: 3,
      title: "Pembayaran Bulan Ini", 
      value: totalPembayaran >= 1000000 
        ? `Rp ${(totalPembayaran / 1000000).toFixed(1)}jt`
        : `Rp ${(totalPembayaran / 1000).toFixed(0)}rb`,
      subtitle: `Total ${pembayaranRecent.length} transaksi`,
      trend: "up",
      icon: CashStack, 
      color: "#f97316",
      bgColor: "#fff7ed"
    },
    { 
      id: 4,
      title: "Kehadiran Hari Ini", 
      value: `${persentaseKehadiran}%`,
      subtitle: `${kehadiranStats.hadir} dari ${kehadiranStats.total} guru`,
      trend: persentaseKehadiran >= 80 ? "up" : "down",
      icon: ClipboardCheck, 
      color: "#8b5cf6",
      bgColor: "#f5f3ff"
    }
  ];

  if (loading) {
    return (
      <Container fluid className="p-4 text-center" style={{ minHeight: "100vh" }}>
        <Spinner animation="border" variant="primary" className="mt-5" />
        <p className="mt-3">Memuat data dashboard...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header Banner */}
      <div 
        className="rounded-3 p-4 mb-4 text-white"
        style={{
          background: "linear-gradient(135deg, #ef4444 0%, #f97316 50%, #10b981 100%)",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}
      >
        <h4 className="mb-2 fw-bold">Dashboard Administrator</h4>
        <p className="mb-0 opacity-90">Selamat datang di SIAKAD Hagios School of Life</p>
        <small className="opacity-75">
          {semesterAktif 
            ? `${semesterAktif.nama} - ${semesterAktif.tahun_ajaran}`
            : 'Belum ada semester aktif'
          }
        </small>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
          return (
            <Col key={stat.id} lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div 
                      className="d-flex align-items-center justify-content-center rounded-3"
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: stat.bgColor,
                        color: stat.color
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <Badge 
                      bg={stat.trend === "up" ? "success" : "danger"}
                      className="d-flex align-items-center gap-1"
                    >
                      <TrendIcon size={12} />
                    </Badge>
                  </div>
                  <p className="text-muted mb-1 small">{stat.title}</p>
                  <h3 className="mb-0 fw-bold">{stat.value}</h3>
                  {stat.subtitle && (
                    <small className="text-muted">{stat.subtitle}</small>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Row className="g-3 mb-3">
        {/* Statistik Per Kelas */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h5 className="mb-4 fw-bold">
                <GraphUp size={20} className="me-2" />
                Statistik Per Kelas
              </h5>
              
              {statistikKelas.length > 0 ? (
                <>
                  {statistikKelas.map((kelas, index) => (
                    <div key={index} className="mb-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="fw-medium">{kelas.tingkat}</span>
                        <span className="text-primary fw-bold">{kelas.jumlah} siswa</span>
                      </div>
                      <ProgressBar 
                        now={(kelas.jumlah / totalSiswa) * 100} 
                        style={{ height: "8px" }}
                      />
                      <small className="text-muted mt-1 d-block">
                        {kelas.rombel} Rombongan Belajar
                      </small>
                    </div>
                  ))}

                  <Card className="bg-light border-0 mt-4">
                    <Card.Body>
                      <div className="text-center">
                        <h2 className="fw-bold text-primary mb-0">
                          {totalSiswa.toLocaleString('id-ID')}
                        </h2>
                        <p className="text-muted mb-0">Total Siswa Aktif</p>
                      </div>
                    </Card.Body>
                  </Card>
                </>
              ) : (
                <p className="text-muted text-center py-4">Belum ada data kelas</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Absensi Guru Hari Ini (dari Sesi Absensi) */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 fw-bold">Absensi Guru Hari Ini</h5>
                <Badge bg="primary" pill>
                  {absensiGuru.length} dari {kehadiranStats.totalGuru} guru
                </Badge>
              </div>
              
              {absensiGuru.length > 0 ? (
                <>
                  <Table hover responsive>
                    <thead className="table-light">
                      <tr>
                        <th>Nama Guru</th>
                        <th>Peran</th>
                        <th>Status</th>
                        <th>Jam Masuk</th>
                        <th>Jam Pulang</th>
                        <th>Durasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absensiGuru.map((guru) => (
                        <tr key={guru.id}>
                          <td className="fw-medium">{guru.nama}</td>
                          <td>
                            <Badge bg="secondary" className="text-uppercase">
                              {guru.peran}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={getStatusBadgeVariant(guru.status)}>
                              {getStatusLabel(guru.status)}
                            </Badge>
                          </td>
                          <td>{guru.waktu}</td>
                          <td>{guru.jam_selesai}</td>
                          <td>
                            <small className="text-muted">{guru.durasi}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {/* Summary Stats */}
                  <Row className="mt-3 g-2">
                    <Col md={4}>
                      <div className="p-3 rounded" style={{ backgroundColor: "#f0fdf4" }}>
                        <div className="d-flex align-items-center">
                          <div className="text-success me-2">
                            <ClipboardCheck size={24} />
                          </div>
                          <div>
                            <small className="text-muted d-block">Hadir</small>
                            <strong className="text-success fs-5">
                              {kehadiranStats.hadir}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="p-3 rounded" style={{ backgroundColor: "#fff7ed" }}>
                        <div className="d-flex align-items-center">
                          <div className="text-warning me-2">
                            <ClipboardCheck size={24} />
                          </div>
                          <div>
                            <small className="text-muted d-block">Izin</small>
                            <strong className="text-warning fs-5">
                              {kehadiranStats.izin}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="p-3 rounded" style={{ backgroundColor: "#fef2f2" }}>
                        <div className="d-flex align-items-center">
                          <div className="text-danger me-2">
                            <ClipboardCheck size={24} />
                          </div>
                          <div>
                            <small className="text-muted d-block">Invalid</small>
                            <strong className="text-danger fs-5">
                              {kehadiranStats.invalid}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div className="mt-3 p-3 rounded" style={{ backgroundColor: "#eff6ff" }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-primary">
                          Tingkat Kehadiran: {persentaseKehadiran}%
                        </strong>
                        <p className="mb-0 small text-muted">
                          {kehadiranStats.total} dari {kehadiranStats.totalGuru} guru sudah absen
                        </p>
                      </div>
                      <ProgressBar 
                        now={persentaseKehadiran} 
                        style={{ width: "150px", height: "10px" }}
                        variant={persentaseKehadiran >= 80 ? "success" : "warning"}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <ClipboardCheck size={48} className="text-muted mb-3" />
                  <p className="text-muted">Belum ada data absensi guru hari ini</p>
                  <small className="text-muted">
                    Guru belum melakukan absensi atau belum ada sesi hari ini
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        {/* Pembayaran SPP Terbaru */}
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-4 fw-bold">Pembayaran Terbaru</h5>
              
              {pembayaranRecent.length > 0 ? (
                <>
                  <Table hover responsive>
                    <thead className="table-light">
                      <tr>
                        <th>Nama Siswa</th>
                        <th>Kelas</th>
                        <th>Bulan</th>
                        <th>Tahun</th>
                        <th>Jumlah</th>
                        <th>Tanggal Verifikasi</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pembayaranRecent.map((item) => (
                        <tr key={item.id}>
                          <td className="fw-medium">{item.nama}</td>
                          <td>
                            <Badge bg="info">{item.kelas}</Badge>
                          </td>
                          <td>{item.bulan}</td>
                          <td>{item.tahun}</td>
                          <td className="text-success fw-bold">
                            Rp {parseFloat(item.jumlah).toLocaleString('id-ID')}
                          </td>
                          <td>
                            <small className="text-muted">{item.tanggal}</small>
                          </td>
                          <td>
                            <Badge bg={item.status === "DITERIMA" ? "success" : "warning"}>
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <div className="mt-3 p-3 rounded" style={{ backgroundColor: "#f0fdf4" }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-success">Total Pembayaran Bulan Ini</strong>
                        <p className="mb-0 small text-muted">
                          Dari {pembayaranRecent.length} transaksi yang terverifikasi
                        </p>
                      </div>
                      <div className="text-end">
                        <span className="text-success fs-4 fw-bold">
                          Rp {totalPembayaran.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <CashStack size={48} className="text-muted mb-3" />
                  <p className="text-muted">Belum ada pembayaran yang diverifikasi bulan ini</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}