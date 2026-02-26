import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Badge, ProgressBar, Spinner } from "react-bootstrap";
import { People, PersonBadge, CashStack, ClipboardCheck, GraphUp } from "react-bootstrap-icons";
import { TrendingUp, TrendingDown } from "lucide-react";

// Import API services
import { getDashboardStats } from "../../services/userApi";

export default function DashboardAdmin() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // ✅ Single API call - all data pre-processed
      const response = await getDashboardStats();
      
      if (response.success) {
        setDashboardData(response.data);
      }
      
    } catch (error) {
      console.error("Error loading dashboard:", error);
      // Show error toast/notification
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="p-4 text-center" style={{ minHeight: "100vh" }}>
        <Spinner animation="border" variant="primary" className="mt-5" />
        <p className="mt-3">Memuat data dashboard...</p>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container fluid className="p-4">
        <div className="alert alert-danger">
          Gagal memuat data dashboard. Silakan refresh halaman.
        </div>
      </Container>
    );
  }

  const { stats, kehadiranStats, pembayaranRecent, absensiGuru, statistikKelas, semesterAktif } = dashboardData;

  const statsCards = [
    { 
      id: 1,
      title: "Total Siswa", 
      value: stats.totalSiswa.toLocaleString('id-ID'),
      subtitle: "Siswa Aktif",
      trend: "up",
      icon: People, 
      color: "#3b82f6",
      bgColor: "#eff6ff"
    },
    { 
      id: 2,
      title: "Total Guru", 
      value: stats.totalGuru.toLocaleString('id-ID'),
      subtitle: "Tenaga Pengajar",
      trend: "up",
      icon: PersonBadge, 
      color: "#10b981",
      bgColor: "#f0fdf4"
    },
    { 
      id: 3,
      title: "Pembayaran Bulan Ini", 
      value: stats.totalPembayaran >= 1000000 
        ? `Rp ${(stats.totalPembayaran / 1000000).toFixed(1)}jt`
        : `Rp ${(stats.totalPembayaran / 1000).toFixed(0)}rb`,
      subtitle: `Total ${pembayaranRecent.length} transaksi`,
      trend: "up",
      icon: CashStack, 
      color: "#f97316",
      bgColor: "#fff7ed"
    },
    { 
      id: 4,
      title: "Kehadiran Hari Ini", 
      value: `${stats.persentaseKehadiran}%`,
      subtitle: `${kehadiranStats.hadir} dari ${kehadiranStats.total} guru`,
      trend: stats.persentaseKehadiran >= 80 ? "up" : "down",
      icon: ClipboardCheck, 
      color: "#8b5cf6",
      bgColor: "#f5f3ff"
    }
  ];

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
                        now={(kelas.jumlah / stats.totalSiswa) * 100} 
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
                          {stats.totalSiswa.toLocaleString('id-ID')}
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
                          Tingkat Kehadiran: {stats.persentaseKehadiran}%
                        </strong>
                        <p className="mb-0 small text-muted">
                          {kehadiranStats.total} dari {kehadiranStats.totalGuru} guru sudah absen
                        </p>
                      </div>
                      <ProgressBar 
                        now={stats.persentaseKehadiran} 
                        style={{ width: "150px", height: "10px" }}
                        variant={stats.persentaseKehadiran >= 80 ? "success" : "warning"}
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