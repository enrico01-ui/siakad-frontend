import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Badge, ProgressBar, Spinner } from "react-bootstrap";
import { People, PersonBadge, CashStack, ClipboardCheck, GraphUp } from "react-bootstrap-icons";
import { TrendingUp, TrendingDown } from "lucide-react";

// Import API services
import { getSiswa } from "../../services/siswaApi";
import { getGuru } from "../../services/guruApi";
import { getSpp } from "../../services/sppApi";
import { getAbsensi } from "../../services/absensiApi";
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
  const [kehadiranStats, setKehadiranStats] = useState({ hadir: 0, total: 0 });

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
      const [siswaRes, guruRes, sppRes, absensiRes, kelasRes] = await Promise.all([
        getSiswa(),
        getGuru(),
        getSpp(),
        getAbsensi(),
        getKelas()
      ]);

      // Process Siswa - filter yang AKTIF (uppercase sesuai DB)
      const siswaAktif = (siswaRes.data || []).filter(s => s.status === 'AKTIF');
      setTotalSiswa(siswaAktif.length);

      // Process Guru
      setTotalGuru((guruRes.data || []).length);

      // Process SPP - hitung total pembayaran bulan ini yang LUNAS
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      const sppBulanIni = (sppRes.data || []).filter(spp => {
        // Filter berdasarkan bulan dan tahun dari field bulan & tahun
        return (
          spp.status === 'LUNAS' &&
          parseInt(spp.bulan) === currentMonth &&
          parseInt(spp.tahun) === currentYear
        );
      });

      const totalSpp = sppBulanIni.reduce((sum, spp) => sum + (parseFloat(spp.jumlah) || 0), 0);
      setTotalPembayaran(totalSpp);

      // Get recent pembayaran (5 terbaru berdasarkan tanggal_verifikasi)
      const recentSpp = (sppRes.data || [])
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
          status: spp.status === 'LUNAS' ? 'Lunas' : spp.status === 'BELUM_LUNAS' ? 'Belum Lunas' : spp.status,
          tanggal: new Date(spp.tanggal_verifikasi).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          })
        }));
      setPembayaranRecent(recentSpp);

      // Process Absensi Guru - hari ini
      const todayStr = today.toISOString().split('T')[0];
      const absensiHariIni = (absensiRes.data || []).filter(abs => {
        const absDate = new Date(abs.tanggal).toISOString().split('T')[0];
        return absDate === todayStr;
      });

      // Group by guru dan ambil data terakhir per guru
      const guruAbsensiMap = new Map();
      absensiHariIni.forEach(abs => {
        const guruId = abs.guru_id;
        if (!guruAbsensiMap.has(guruId) || 
            new Date(abs.tanggal + ' ' + abs.jam) > new Date(guruAbsensiMap.get(guruId).tanggal + ' ' + guruAbsensiMap.get(guruId).jam)) {
          guruAbsensiMap.set(guruId, abs);
        }
      });

      // Convert to array
      const absensiList = Array.from(guruAbsensiMap.values()).map(abs => {
        return {
          id: abs.id,
          nama: abs.guru?.nama || '-',
          peran: abs.guru?.peran || '-',
          status: abs.status, // HADIR | IZIN | SAKIT | ALPHA
          waktu: abs.jam
        };
      });

      setAbsensiGuru(absensiList.slice(0, 5)); // Ambil 5 teratas

      // Hitung persentase kehadiran (hanya yang HADIR)
      const hadir = absensiList.filter(a => a.status === 'HADIR').length;
      const totalGuruAbsen = guruRes.data.length;
      const persentase = totalGuruAbsen > 0 ? ((hadir / totalGuruAbsen) * 100).toFixed(1) : 0;
      setPersentaseKehadiran(persentase);
      setKehadiranStats({ hadir, total: totalGuruAbsen });

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
        const finalData = Object.values(kelasStats);
console.log("Data siap tampil:", finalData);
      setStatistikKelas(Object.values(kelasStats));

    } catch (error) {
      console.error("Error loading dashboard data:", error);
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
    switch(status) {
      case 'HADIR': return 'success';
      case 'IZIN': return 'warning';
      case 'SAKIT': return 'info';
      case 'ALPHA': return 'danger';
      default: return 'secondary';
    }
  };

  const statsCards = [
    { 
      id: 1,
      title: "Total Siswa", 
      value: totalSiswa.toLocaleString('id-ID'),
      trend: "up",
      icon: People, 
      color: "#3b82f6",
      bgColor: "#eff6ff"
    },
    { 
      id: 2,
      title: "Total Guru", 
      value: totalGuru.toLocaleString('id-ID'),
      trend: "up",
      icon: PersonBadge, 
      color: "#10b981",
      bgColor: "#f0fdf4"
    },
    { 
      id: 3,
      title: "Pembayaran SPP Bulan Ini", 
      value: `Rp ${Math.floor(totalPembayaran / 1000000)}jt`,
      trend: "up",
      icon: CashStack, 
      color: "#f97316",
      bgColor: "#fff7ed"
    },
    { 
      id: 4,
      title: "Kehadiran Hari Ini", 
      value: `${persentaseKehadiran}%`,
      trend: persentaseKehadiran >= 90 ? "up" : "down",
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

        {/* Absensi Guru */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h5 className="mb-4 fw-bold">Absensi Guru Hari Ini</h5>
              
              {absensiGuru.length > 0 ? (
                <>
                  <Table hover responsive>
                    <thead className="table-light">
                      <tr>
                        <th>Nama Guru</th>
                        <th>Peran</th>
                        <th>Status</th>
                        <th>Waktu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absensiGuru.map((guru) => (
                        <tr key={guru.id}>
                          <td className="fw-medium">{guru.nama}</td>
                          <td>
                            <Badge bg="secondary">
                              {guru.peran}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={getStatusBadgeVariant(guru.status)}>
                              {guru.status}
                            </Badge>
                          </td>
                          <td>{guru.waktu}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <div className="mt-3 d-flex justify-content-between align-items-center p-3 rounded" style={{ backgroundColor: "#f0fdf4" }}>
                    <div>
                      <strong className="text-success">
                        {kehadiranStats.hadir} dari {kehadiranStats.total} guru hadir
                      </strong>
                      <p className="mb-0 small text-muted">
                        Tingkat kehadiran: {persentaseKehadiran}%
                      </p>
                    </div>
                    <div className="text-success">
                      <ClipboardCheck size={32} />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted text-center py-4">Belum ada data absensi hari ini</p>
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
              <h5 className="mb-4 fw-bold">Pembayaran SPP Terbaru</h5>
              
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
                          <td>{item.kelas}</td>
                          <td>{item.bulan}</td>
                          <td>{item.tahun}</td>
                          <td className="text-success fw-bold">
                            Rp {parseFloat(item.jumlah).toLocaleString('id-ID')}
                          </td>
                          <td>{item.tanggal}</td>
                          <td>
                            <Badge bg={item.status === "Lunas" ? "success" : "warning"}>
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <div className="mt-3 text-end">
                    <strong>Total Pembayaran Bulan Ini: </strong>
                    <span className="text-success fs-5 fw-bold">
                      Rp {totalPembayaran.toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-muted text-center py-4">Belum ada pembayaran yang diverifikasi</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}