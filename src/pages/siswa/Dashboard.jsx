import { Container, Row, Col, Card, ProgressBar, Badge, ListGroup } from "react-bootstrap";
import { Book, Award, CashStack, Calendar, TrophyFill, ClockHistory } from "react-bootstrap-icons";

export default function DashboardSiswa() {
  const statsCards = [
    { 
      title: "Nilai Rata-rata", 
      value: "85.5", 
      icon: Award, 
      color: "#10b981",
      bgColor: "#f0fdf4"
    },
    { 
      title: "Mata Pelajaran", 
      value: "12", 
      icon: Book, 
      color: "#3b82f6",
      bgColor: "#eff6ff"
    },
    { 
      title: "Status SPP", 
      value: "Lunas", 
      icon: CashStack, 
      color: "#10b981",
      bgColor: "#f0fdf4"
    },
    { 
      title: "Kehadiran", 
      value: "95%", 
      icon: Calendar, 
      color: "#f97316",
      bgColor: "#fff7ed"
    }
  ];

  const nilaiTerbaru = [
    { matpel: "Matematika", nilai: 88, tugas: "UTS Semester Ganjil", tanggal: "20 Des 2024" },
    { matpel: "Bahasa Indonesia", nilai: 90, tugas: "UTS Semester Ganjil", tanggal: "18 Des 2024" },
    { matpel: "Bahasa Inggris", nilai: 85, tugas: "UTS Semester Ganjil", tanggal: "15 Des 2024" },
    { matpel: "Fisika", nilai: 82, tugas: "UTS Semester Ganjil", tanggal: "13 Des 2024" }
  ];

  const pengumumanList = [
    {
      category: "Akademik",
      title: "Pengumuman Hasil UTS Semester Ganjil 2024/2025",
      date: "5 Jan 2025",
      color: "#3b82f6"
    },
    {
      category: "Keuangan",
      title: "Batas Akhir Pembayaran SPP Februari 2025",
      date: "25 Jan 2025",
      color: "#f97316"
    },
    {
      category: "Kegiatan",
      title: "Pendaftaran Ekstrakurikuler Semester Genap",
      date: "10 Jan 2025",
      color: "#8b5cf6"
    }
  ];

  const getGradeColor = (nilai) => {
    if (nilai >= 85) return "#10b981";
    if (nilai >= 75) return "#3b82f6";
    if (nilai >= 65) return "#f97316";
    return "#ef4444";
  };

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header Banner */}
      <div 
        className="rounded-3 p-4 mb-4 text-white"
        style={{
          background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}
      >
        <h4 className="mb-2 fw-bold">Dashboard Siswa</h4>
        <p className="mb-0 opacity-90">Selamat datang di SIAKAD Hagios School of Life</p>
        <small className="opacity-75">Kelas: XII IPA 1 | NIS: 2024001</small>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Col key={index} lg={3} md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1 small">{stat.title}</p>
                    <h3 className="mb-0 fw-bold">{stat.value}</h3>
                  </div>
                  <div 
                    className="d-flex align-items-center justify-content-center rounded-3"
                    style={{
                      width: "60px",
                      height: "60px",
                      backgroundColor: stat.bgColor,
                      color: stat.color
                    }}
                  >
                    <Icon size={28} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Row className="g-3">
        {/* Progress & Nilai */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body>
              <h5 className="mb-4 fw-bold">Progress Semester</h5>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-medium">Semester Ganjil 2024/2025</span>
                  <span className="text-primary fw-bold">65%</span>
                </div>
                <ProgressBar 
                  now={65} 
                  style={{ height: "10px" }}
                  variant="primary"
                />
                <small className="text-muted mt-1 d-block">
                  9 dari 14 minggu telah berlalu
                </small>
              </div>

              <div className="mt-3 p-3 rounded" style={{ backgroundColor: "#eff6ff" }}>
                <div className="d-flex align-items-center">
                  <TrophyFill size={24} className="text-primary me-3" />
                  <div>
                    <strong>Ranking Kelas: 5</strong>
                    <p className="mb-0 small text-muted">dari 32 siswa</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-4 fw-bold">
                <ClockHistory size={20} className="me-2" />
                Nilai Terbaru
              </h5>
              
              <ListGroup variant="flush">
                {nilaiTerbaru.map((item, index) => (
                  <ListGroup.Item key={index} className="px-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{item.matpel}</h6>
                        <small className="text-muted">{item.tugas}</small>
                        <br />
                        <small className="text-muted">
                          <Calendar size={12} className="me-1" />
                          {item.tanggal}
                        </small>
                      </div>
                      <div className="text-end">
                        <h4 
                          className="mb-0 fw-bold"
                          style={{ color: getGradeColor(item.nilai) }}
                        >
                          {item.nilai}
                        </h4>
                        <small className="text-muted">dari 100</small>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Pengumuman */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h5 className="mb-4 fw-bold">Pengumuman</h5>
              
              <div className="d-flex flex-column gap-3">
                {pengumumanList.map((item, index) => (
                  <div key={index}>
                    <div className="d-flex align-items-start">
                      <div className="flex-grow-1">
                        <Badge 
                          bg="" 
                          className="mb-2"
                          style={{ 
                            backgroundColor: item.color + "20",
                            color: item.color,
                            fontSize: "0.7rem",
                            fontWeight: "500"
                          }}
                        >
                          {item.category}
                        </Badge>
                        <p className="mb-1 fw-medium" style={{ fontSize: "0.9rem" }}>
                          {item.title}
                        </p>
                        <small className="text-muted">
                          <Calendar size={12} className="me-1" />
                          {item.date}
                        </small>
                      </div>
                    </div>
                    {index < pengumumanList.length - 1 && (
                      <hr className="my-3" style={{ opacity: 0.1 }} />
                    )}
                  </div>
                ))}
              </div>

              <Card className="bg-light border-0 mt-4">
                <Card.Body>
                  <h6 className="mb-2 fw-bold">Status Pembayaran SPP</h6>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Januari 2025</span>
                    <Badge bg="success">Lunas</Badge>
                  </div>
                  <hr style={{ opacity: 0.1 }} />
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Februari 2025</span>
                    <Badge bg="warning">Belum Bayar</Badge>
                  </div>
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
} 