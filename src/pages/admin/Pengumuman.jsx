import { use, useEffect, useState } from "react";
import { 
  Container, Row, Col, Card, Button, Form, Table, Badge, 
  Modal, InputGroup, Spinner, Alert 
} from "react-bootstrap";
import { 
  Plus, Megaphone, Eye, XCircle, CheckCircle, 
  Calendar, Person, Search, Pencil
} from "react-bootstrap-icons";
import { 
  createPengumuman, 
  getAllPengumuman, 
  nonaktifkanPengumuman ,
  getPengumumanGuru
} from "../../services/pengumumanApi";
import toast from "react-hot-toast";

export default function PengumumanAdmin() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const user = JSON.parse(localStorage.getItem("user"));
  const guru = user ? user.guru : null;
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPengumuman, setSelectedPengumuman] = useState(null);
  const [kelas_id, setKelasId] = useState([]);
  
const [formData, setFormData] = useState({
    judul: "",
    isi: "",
    kelas_id: []
  });

  useEffect(() => {
  if (guru?.kelas?.length > 0) {
    const ids = guru.kelas.map(k => k.id);
    setKelasId(ids);
    setFormData(prev => ({
      ...prev,
      kelas_id: ids
    }));
  }
}, []);
  // Form states
  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getPengumumanGuru();
      setList(res.data || []);
    } catch (error) {
      console.error("Error fetching pengumuman:", error);
      toast.error("Gagal memuat data pengumuman");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log("Submitting form data:", formData);
      setLoading(true);
      await createPengumuman(formData);
      toast.success("Pengumuman berhasil dibuat dan dipublikasikan!");
      
      // Reset form
      setFormData({ judul: "", isi: "", kelas_id: kelas_id });
      setShowAddModal(false);
      
      // Reload data
      await fetchData();
    } catch (error) {
      console.error("Error creating pengumuman:", error);
      toast.error("Gagal membuat pengumuman");
    } finally {
      setLoading(false);
    }
  };

  const handleNonaktifkan = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menonaktifkan pengumuman ini?")) {
      return;
    }

    try {
      setLoading(true);
      await nonaktifkanPengumuman(id);
      toast.success("Pengumuman berhasil dinonaktifkan");
      await fetchData();
    } catch (error) {
      console.error("Error nonaktifkan pengumuman:", error);
      toast.error("Gagal menonaktifkan pengumuman");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (pengumuman) => {
    setSelectedPengumuman(pengumuman);
    setShowDetailModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Filter data
  const filteredData = list.filter(p => {
    const matchSearch = p.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       p.isi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || 
                       (filterStatus === "active" && p.is_active) ||
                       (filterStatus === "inactive" && !p.is_active);
    return matchSearch && matchStatus;
  });

  const stats = {
    total: list.length,
    active: list.filter(p => p.is_active).length,
    inactive: list.filter(p => !p.is_active).length
  };

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <Megaphone size={32} className="me-2 text-primary" />
            Manajemen Pengumuman
          </h2>
          <p className="text-muted mb-0">Kelola pengumuman untuk siswa</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowAddModal(true)}
          disabled={loading}
        >
          <Plus size={20} className="me-2" />
          Buat Pengumuman
        </Button>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Total Pengumuman</p>
                  <h3 className="mb-0 fw-bold">{stats.total}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                  <Megaphone size={24} className="text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Aktif</p>
                  <h3 className="mb-0 fw-bold text-success">{stats.active}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-3">
                  <CheckCircle size={24} className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Nonaktif</p>
                  <h3 className="mb-0 fw-bold text-secondary">{stats.inactive}</h3>
                </div>
                <div className="bg-secondary bg-opacity-10 p-3 rounded-3">
                  <XCircle size={24} className="text-secondary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {/* Search & Filter */}
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Cari pengumuman..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </Form.Select>
            </Col>
          </Row>

          {/* Table */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Memuat data...</p>
            </div>
          ) : (
            <Table hover responsive>
              <thead className="table-light">
                <tr>
                  <th style={{ width: "5%" }}>No</th>
                  <th style={{ width: "30%" }}>Judul</th>
                  <th style={{ width: "35%" }}>Isi Pengumuman</th>
                  <th style={{ width: "12%" }}>Dibuat Oleh</th>
                  <th style={{ width: "10%" }}>Tanggal</th>
                  <th style={{ width: "8%" }}>Status</th>
                  <th style={{ width: "15%" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((pengumuman, index) => (
                    <tr key={pengumuman.id}>
                      <td>{index + 1}</td>
                      <td className="fw-medium">{pengumuman.judul}</td>
                      <td>
                        <div style={{ 
                          maxWidth: "300px", 
                          overflow: "hidden", 
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap" 
                        }}>
                          {pengumuman.isi}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Person size={16} className="me-1 text-muted" />
                          <small>{pengumuman.creator?.name || 'Admin'}</small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Calendar size={14} className="me-1 text-muted" />
                          <small>
                            {new Date(pengumuman.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </small>
                        </div>
                      </td>
                      <td>
                        {pengumuman.is_active ? (
                          <Badge bg="success" className="d-flex align-items-center gap-1">
                            <CheckCircle size={12} />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge bg="secondary" className="d-flex align-items-center gap-1">
                            <XCircle size={12} />
                            Nonaktif
                          </Badge>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleViewDetail(pengumuman)}
                          >
                            <Eye size={14} />
                          </Button>
                          {pengumuman.is_active && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleNonaktifkan(pengumuman.id)}
                              disabled={loading}
                            >
                              <XCircle size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      {searchTerm ? "Tidak ada hasil pencarian" : "Belum ada pengumuman"}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <Megaphone className="me-2" />
            Buat Pengumuman Baru
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Alert variant="info" className="d-flex align-items-start">
              <CheckCircle size={20} className="me-2 mt-1" />
              <div>
                <strong>Info:</strong> Pengumuman akan otomatis dipublikasikan ke semua siswa.
              </div>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>
                Judul Pengumuman <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="judul"
                placeholder="Contoh: Libur Semester Genap 2024/2025"
                value={formData.judul}
                onChange={handleInputChange}
                required
                maxLength={255}
              />
              <Form.Text className="text-muted">
                Maksimal 255 karakter
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Isi Pengumuman <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="isi"
                placeholder="Tulis isi pengumuman di sini..."
                value={formData.isi}
                onChange={handleInputChange}
                required
              />
              <Form.Text className="text-muted">
                Jelaskan pengumuman dengan detail
              </Form.Text>
            </Form.Group>

            <Card className="bg-light border-0">
              <Card.Body>
                <h6 className="fw-bold mb-2">Preview:</h6>
                <div>
                  <strong>{formData.judul || "(Judul pengumuman)"}</strong>
                  <p className="mb-0 mt-2 text-muted" style={{ whiteSpace: "pre-wrap" }}>
                    {formData.isi || "(Isi pengumuman akan muncul di sini)"}
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowAddModal(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="me-2" />
                  Publikasikan
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal 
        show={showDetailModal} 
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Detail Pengumuman</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPengumuman && (
            <>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h4 className="fw-bold mb-0">{selectedPengumuman.judul}</h4>
                  {selectedPengumuman.is_active ? (
                    <Badge bg="success" className="d-flex align-items-center gap-1">
                      <CheckCircle size={14} />
                      Aktif
                    </Badge>
                  ) : (
                    <Badge bg="secondary" className="d-flex align-items-center gap-1">
                      <XCircle size={14} />
                      Nonaktif
                    </Badge>
                  )}
                </div>

                <div className="d-flex gap-3 text-muted mb-3">
                  <small>
                    <Person size={14} className="me-1" />
                    {selectedPengumuman.creator?.name || 'Admin'}
                  </small>
                  <small>
                    <Calendar size={14} className="me-1" />
                    {new Date(selectedPengumuman.created_at).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </small>
                </div>

                <hr />

                <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                  {selectedPengumuman.isi}
                </div>
              </div>

              <Card className="bg-light border-0">
                <Card.Body>
                  <h6 className="fw-bold mb-2">Informasi Target:</h6>
                  <Badge bg="primary">Siswa (Semua Kelas)</Badge>
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedPengumuman?.is_active && (
            <Button 
              variant="danger"
              onClick={() => {
                handleNonaktifkan(selectedPengumuman.id);
                setShowDetailModal(false);
              }}
              disabled={loading}
            >
              <XCircle size={16} className="me-2" />
              Nonaktifkan
            </Button>
          )}
          <Button 
            variant="secondary" 
            onClick={() => setShowDetailModal(false)}
          >
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}