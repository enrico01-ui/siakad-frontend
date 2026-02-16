import { useState, useEffect } from "react";
import { 
  Container, Row, Col, Card, Table, Button, 
  Modal, Form, Badge, InputGroup, Spinner, Alert 
} from "react-bootstrap";
import { 
  Plus, Pencil, Trash, Search, Calendar, CheckCircle, XCircle
} from "react-bootstrap-icons";
import { getSemester, createSemester, aktifkanSemester } from "../../services/semesterApi";

export default function SemesterManagement() {
  const [loading, setLoading] = useState(false);
  const [dataSemester, setDataSemester] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nama: "",
    tahun_ajaran: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    is_aktif: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getSemester();
      setDataSemester(response.data || []);
    } catch (error) {
      console.error("Error loading semester:", error);
      alert("Gagal memuat data semester!");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setModalMode("add");
    setSelectedItem(null);
    setFormData({
      nama: "",
      tahun_ajaran: "",
      tanggal_mulai: "",
      tanggal_selesai: "",
      is_aktif: false
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalMode("edit");
    setSelectedItem(item);
    setFormData({
      nama: item.nama || "",
      tahun_ajaran: item.tahun_ajaran || "",
      tanggal_mulai: item.tanggal_mulai || "",
      tanggal_selesai: item.tanggal_selesai || "",
      is_aktif: item.is_aktif || false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (modalMode === "add") {
        await createSemester(formData);
        alert("Semester berhasil ditambahkan!");
      } else {
        // If you have update API, use it here
        // For now, we'll just show message
        alert("Fitur edit belum tersedia. Silakan hapus dan buat ulang.");
      }
      
      setShowModal(false);
      await loadData();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Gagal menyimpan data!");
    } finally {
      setLoading(false);
    }
  };

  const handleSetAktif = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin mengaktifkan semester ini? Semester lain akan otomatis dinonaktifkan.")) return;

    try {
      setLoading(true);
      await aktifkanSemester(id);
      alert("Semester berhasil diaktifkan!");
      await loadData();
    } catch (error) {
      console.error("Error setting aktif:", error);
      alert("Gagal mengaktifkan semester!");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const filtered = dataSemester.filter(item =>
    item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tahun_ajaran?.includes(searchTerm)
  );

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <h2 className="mb-4 fw-bold">Manajemen Semester</h2>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Cari semester..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <Button variant="primary" onClick={handleAdd} disabled={loading}>
                <Plus size={20} className="me-2" />
                Tambah Semester
              </Button>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Memuat data...</p>
            </div>
          ) : (
            <>
              {/* Active Semester Alert */}
              {dataSemester.find(s => s.is_aktif) && (
                <Alert variant="info" className="mb-3">
                  <strong>Semester Aktif:</strong> {dataSemester.find(s => s.is_aktif).nama} - {dataSemester.find(s => s.is_aktif).tahun_ajaran}
                </Alert>
              )}

              <Table hover responsive>
                <thead className="table-light">
                  <tr>
                    <th>Nama Semester</th>
                    <th>Tahun Ajaran</th>
                    <th>Tanggal Mulai</th>
                    <th>Tanggal Selesai</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((semester) => (
                      <tr key={semester.id} className={semester.is_aktif ? 'table-active' : ''}>
                        <td className="fw-medium">
                          {semester.nama}
                          {semester.is_aktif ? (
                            <Badge bg="success" className="ms-2" pill>
                              <CheckCircle size={12} className="me-1" />
                              Aktif
                            </Badge>
                          ) : ""}
                        </td>
                        <td>{semester.tahun_ajaran}</td>
                        <td>
                          <Calendar size={14} className="me-1 text-muted" />
                          {semester.tanggal_mulai 
                            ? new Date(semester.tanggal_mulai).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : '-'
                          }
                        </td>
                        <td>
                          <Calendar size={14} className="me-1 text-muted" />
                          {semester.tanggal_selesai 
                            ? new Date(semester.tanggal_selesai).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : '-'
                          }
                        </td>
                        <td>
                          {semester.is_aktif ? (
                            <Badge bg="success" className="d-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
                              <CheckCircle size={14} />
                              Aktif
                            </Badge>
                          ) : (
                            <Badge bg="secondary">Tidak Aktif</Badge>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            {!semester.is_aktif && (
                              <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => handleSetAktif(semester.id)}
                                disabled={loading}
                              >
                                <CheckCircle size={14} className="me-1" />
                                Aktifkan
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleEdit(semester)}
                              disabled={loading}
                            >
                              <Pencil size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">
                        {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada data semester'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal Form */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <Calendar className="me-2" />
            {modalMode === "add" ? "Tambah" : "Edit"} Semester
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nama Semester <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="nama"
                placeholder="Contoh: Semester Ganjil"
                value={formData.nama}
                onChange={handleInputChange}
                required
              />
              <Form.Text className="text-muted">
                Contoh: Semester Ganjil, Semester Genap
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tahun Ajaran <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="tahun_ajaran"
                placeholder="Contoh: 2024/2025"
                value={formData.tahun_ajaran}
                onChange={handleInputChange}
                required
              />
              <Form.Text className="text-muted">
                Format: YYYY/YYYY (contoh: 2024/2025)
              </Form.Text>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tanggal Mulai <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="tanggal_mulai"
                    value={formData.tanggal_mulai}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tanggal Selesai <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="tanggal_selesai"
                    value={formData.tanggal_selesai}
                    onChange={handleInputChange}
                    required
                    min={formData.tanggal_mulai}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Alert variant="info" className="mb-3">
              <small>
                <strong>Info:</strong> Semester dapat diaktifkan setelah dibuat melalui tombol "Aktifkan" di tabel.
              </small>
            </Alert>

            {modalMode === "add" && (
              <Form.Group className="mb-3">
                <Form.Check 
                  type="checkbox"
                  name="is_aktif"
                  label="Aktifkan semester ini sekaligus"
                  checked={formData.is_aktif}
                  onChange={handleInputChange}
                />
                <Form.Text className="text-muted">
                  Jika dicentang, semester ini akan langsung aktif dan semester lain otomatis nonaktif
                </Form.Text>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle size={16} className="me-2" />
                  Simpan
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}