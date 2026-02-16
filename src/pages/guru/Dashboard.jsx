import { Container, Row, Col, Card, ProgressBar, Badge, Table } from "react-bootstrap";
import { useEffect, useState } from "react";
import { Book, People, FileEarmarkArrowUp, Calendar, Clock, CheckCircle } from "react-bootstrap-icons";
import { getGuruKelas, getKelasSiswa } from "../../services/guruApi";


export default function DashboardGuru() {
  const user = JSON.parse(localStorage.getItem("user"));
  const guru = user ? user.guru : null;
  
  const [kelasList, setKelasList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);

  useEffect(() => {
    if(guru.peran == "guru") {
      return;
    }
    const fetchData = async () => {
      try {
        const response = await getGuruKelas();

        const kelas = response.data.kelas || [];
        setKelasList(kelas);

        // default ambil siswa dari kelas pertama
        if (kelas.length > 0) {
          setSiswaList(kelas[0].siswa || []);
        }

        console.log("Kelas:", kelas);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
   
  }, []);


  const statsCards = [
    { 
      title: "Kelas Diampu", 
      value: kelasList.length.toString(), 
      icon: Book, 
      color: "#ef4444",
      bgColor: "#fef2f2"
    },
    { 
      title: "Total Siswa", 
      value: siswaList.length.toString(), 
      icon: People, 
      color: "#3b82f6",
      bgColor: "#eff6ff"
    },
    { 
      title: "Rapor Belum Upload", 
      value: "12", 
      icon: FileEarmarkArrowUp, 
      color: "#f97316",
      bgColor: "#fff7ed"
    },
    { 
      title: "Kehadiran Hari Ini", 
      value: "98%", 
      icon: CheckCircle, 
      color: "#10b981",
      bgColor: "#f0fdf4"
    }
  ];

  const jadwalMengajar = [
    { waktu: "07:00 - 08:30", matpel: "Matematika", kelas: "XII IPA 1", ruang: "Lab 101" },
    { waktu: "08:30 - 10:00", matpel: "Matematika", kelas: "XII IPA 2", ruang: "Lab 102" },
    { waktu: "10:15 - 11:45", matpel: "Matematika", kelas: "XI IPA 1", ruang: "Lab 101" }
  ];

  

  return (
    <>
      <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header Banner */}
      <div 
        className="rounded-3 p-4 mb-4 text-white"
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}
      >
        <h4 className="mb-2 fw-bold">Dashboard Guru</h4>
        <p className="mb-0 opacity-90">Selamat datang di SIAKAD Hagios School of Life</p>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <>
            {guru.peran != "wali_kelas" && index != 3 ? null : (
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
            )} 
            </>
          );
        })}
      </Row>

      <Row className="g-3">
        {/* Jadwal Mengajar */}
        {/* <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h5 className="mb-4 fw-bold">Jadwal Mengajar Hari Ini</h5>
              
              <Table hover responsive>
                <thead className="table-light">
                  <tr>
                    <th><Clock size={16} className="me-2" />Waktu</th>
                    <th>Mata Pelajaran</th>
                    <th>Kelas</th>
                    <th>Ruang</th>
                  </tr>
                </thead>
                <tbody>
                  {jadwalMengajar.map((jadwal, index) => (
                    <tr key={index}>
                      <td className="fw-medium">{jadwal.waktu}</td>
                      <td>{jadwal.matpel}</td>
                      <td>
                        <Badge bg="primary" className="fw-normal">{jadwal.kelas}</Badge>
                      </td>
                      <td>{jadwal.ruang}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Card className="bg-light border-0 mt-4">
                <Card.Body>
                  <h6 className="mb-3 fw-bold">Status Upload Rapor</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Progress Upload Semester Ganjil 2024/2025</span>
                    <span className="text-primary fw-bold">87%</span>
                  </div>
                  <ProgressBar 
                    now={87} 
                    style={{ height: "10px" }}
                    variant="success"
                  />
                  <small className="text-muted mt-2 d-block">
                    83 dari 95 rapor siswa sudah diupload
                  </small>
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </Col> */}

       
      </Row>
    </Container>
    </>
    
  );
}