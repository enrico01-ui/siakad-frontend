import { useEffect, useState } from "react";
import { 
  Container, Card, Table, Badge, Button, Modal, 
  Form, Row, Col, Alert, Spinner, InputGroup, Tabs, Tab
} from "react-bootstrap";
import { 
  People, Upload, Eye, Download, Trash, FileEarmarkPdf,
  PersonCircle, Calendar, Search, CheckCircle
} from "react-bootstrap-icons";
import { getKelasSiswa } from "../../services/guruApi";
import { getSemester as getSemesterList } from "../../services/semesterApi";
import { uploadRaporFile, getRapor, deleteRapor } from "../../services/raporApi";

export default function Kelas() {
  const user = JSON.parse(localStorage.getItem("user"));
  const guru = user ? user.guru : null;
  const isWaliKelas = guru?.peran === "wali_kelas";
  const [semesterList, setSemesterList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [raporList, setRaporList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("all");
  const [activeTab, setActiveTab] = useState("siswa");
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    siswa_id: "",
    semester: "",
    tahun_ajaran: "",
    file: null
  });

  useEffect(() => {
    loadData();
    loadSemester();
  }, []);
   const loadSemester = async () => {
    try {
      const response = await getSemesterList();
      setSemesterList(response.data || []);
      console.log("Semester list:", response.data);
    } catch (error) {
      console.error("Error loading semester:", error);
    }
  };
  const loadData = async () => {
    try {
      setLoading(true);
      let allSiswa = [];
      let kelasData = [];

      if (guru && guru.kelas) {
        for (const kelas of guru.kelas) {
          const response = await getKelasSiswa(kelas.id);
          const siswaKelas = response.data.data || [];
          console.log("All Siswa:", siswaKelas);
          allSiswa = [...allSiswa, ...siswaKelas];
          kelasData.push({
            id: kelas.id,
            nama: kelas.nama_kelas,
            jumlahSiswa: siswaKelas.length
          });
        }
      }
      
      setSiswaList(allSiswa);
      setKelasList(kelasData);
      console.log("Siswa:", allSiswa);
      console.log("Kelas:", kelasData);
      // Load rapor if wali kelas
      if (isWaliKelas) {
        const raporResponse = await getRapor();
        setRaporList(raporResponse.data || []);
        console.log("Rapor:", raporResponse.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUploadModal = (siswa) => {
    setSelectedSiswa(siswa);
    setUploadForm({
      siswa_id: siswa.id,
      semester: "",
      tahun_ajaran: "",
      file: null
    });
    setShowUploadModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert("File harus berformat PDF!");
        e.target.value = "";
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert("Ukuran file maksimal 5MB!");
        e.target.value = "";
        return;
      }

      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUploadRapor = async (e) => {
    e.preventDefault();

    if (!uploadForm.file || !uploadForm.semester || !uploadForm.tahun_ajaran) {
      alert("Semua field harus diisi!");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('siswa_id', uploadForm.siswa_id);
      formData.append('semester', uploadForm.semester);
      formData.append('tahun_ajaran', uploadForm.tahun_ajaran);
      formData.append('file', uploadForm.file);
      console.log("Uploading rapor with data:", uploadForm);
      await uploadRaporFile(formData);
      
      alert("Rapor berhasil diupload!");
      setShowUploadModal(false);
      loadData();
    } catch (error) {
      console.error("Error uploading rapor:", error);
      alert("Gagal upload rapor: " + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRapor = async (raporId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus rapor ini?")) return;

    try {
      await deleteRapor(raporId);
      console.log("Rapor deleted:", raporId);
      alert("Rapor berhasil dihapus!");
      loadData();
    } catch (error) {
      console.error("Error deleting rapor:", error);
      alert("Gagal menghapus rapor!");
    }
  };

  const handleViewDetail = (siswa) => {
    setSelectedSiswa(siswa);
    setShowDetailModal(true);
  };

  const filteredSiswa = siswaList.filter(siswa => {
    const matchSearch = 
      siswa.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      siswa.nis?.includes(searchTerm);
    
    const matchKelas = selectedKelas === "all" || siswa.kelas_id === parseInt(selectedKelas);
    
    return matchSearch && matchKelas;
  });

  const filteredRapor = raporList.filter(rapor => {
    const siswa = rapor.siswa || {};
    return siswa.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           siswa.nis?.includes(searchTerm);
  });

  const getSiswaRapor = (siswaId) => {
    return raporList.filter(rapor => rapor.siswa_id === siswaId);
  };

  const stats = {
    totalSiswa: siswaList.length,
    totalKelas: kelasList.length,
    totalRapor: raporList.length
  };
  const handleSemesterChange = (e) => {
    const semesterNama = e.target.value;
    const selectedSem = semesterList.find(s => s.nama === semesterNama);
    
    setUploadForm({
      ...uploadForm,
      semester: semesterNama,
      tahun_ajaran: selectedSem ? selectedSem.tahun_ajaran : ""
    });
  };

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-0 fw-bold">
            {isWaliKelas ? "Kelas Saya (Wali Kelas)" : "Kelas Saya (Guru)"}
          </h2>
          <p className="text-muted mb-0">
            {guru?.nama} • {guru?.nip || '-'}
          </p>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col lg={4} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Total Siswa</p>
                  <h3 className="mb-0 fw-bold text-primary">{stats.totalSiswa}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                  <People size={28} className="text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Jumlah Kelas</p>
                  <h3 className="mb-0 fw-bold text-success">{stats.totalKelas}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-3">
                  <PersonCircle size={28} className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        {isWaliKelas && (
          <Col lg={4} md={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 small">Total Rapor</p>
                    <h3 className="mb-0 fw-bold text-info">{stats.totalRapor}</h3>
                  </div>
                  <div className="bg-info bg-opacity-10 p-3 rounded-3">
                    <FileEarmarkPdf size={28} className="text-info" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Info Alert for Guru Biasa */}
      {!isWaliKelas && (
        <Alert variant="info" className="mb-3">
          <strong>Info:</strong> Anda login sebagai Guru. Anda hanya bisa melihat data siswa. 
          Untuk upload rapor, hubungi Wali Kelas.
        </Alert>
      )}

      {/* Main Card */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {/* Tabs */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="siswa" title={
              <>
                <People className="me-2" />
                Data Siswa
              </>
            } />
            {isWaliKelas && (
              <Tab eventKey="rapor" title={
                <>
                  <FileEarmarkPdf className="me-2" />
                  Data Rapor
                </>
              } />
            )}
          </Tabs>

          {/* Filters */}
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Cari nama atau NIS siswa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            {kelasList.length > 1 && activeTab === "siswa" && (
              <Col md={4}>
                <Form.Select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                >
                  <option value="all">Semua Kelas</option>
                  {kelasList.map(kelas => (
                    <option key={kelas.id} value={kelas.id}>
                      {kelas.nama} ({kelas.jumlahSiswa} siswa)
                    </option>
                  ))}
                </Form.Select>
              </Col>
            )}
          </Row>

          {/* Content */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Memuat data...</p>
            </div>
          ) : activeTab === "siswa" ? (
            <TableSiswa 
              data={filteredSiswa} 
              isWaliKelas={isWaliKelas}
              onUpload={handleOpenUploadModal}
              onViewDetail={handleViewDetail}
              getSiswaRapor={getSiswaRapor}
            />
          ) : (
            <TableRapor 
              data={filteredRapor}
              onDelete={handleDeleteRapor}
            />
          )}
        </Card.Body>
      </Card>

      {/* Upload Rapor Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Upload Rapor Siswa</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUploadRapor}>
          <Modal.Body>
            {selectedSiswa && (
              <Alert variant="info" className="mb-3">
                <strong>Siswa:</strong> {selectedSiswa.nama} ({selectedSiswa.nis}) - {selectedSiswa.kelas?.nama_kelas}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Semester <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={uploadForm.semester}
                onChange={handleSemesterChange}
                required
              >
                <option value="">Pilih Semester</option>
                {semesterList.map(sem => (
                  <option key={sem.id} value={sem.nama}>
                    {sem.nama} - {sem.tahun_ajaran}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Pilih semester aktif
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tahun Ajaran <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Contoh: 2024/2025"
                value={uploadForm.tahun_ajaran}
                onChange={(e) => setUploadForm({...uploadForm, tahun_ajaran: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>File Rapor <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
              />
              <Form.Text className="text-muted">
                Format: PDF. Maksimal 5MB.
              </Form.Text>
            </Form.Group>

            {uploadForm.file && (
              <Alert variant="success">
                <CheckCircle className="me-2" />
                File terpilih: <strong>{uploadForm.file.name}</strong> ({(uploadForm.file.size / 1024).toFixed(2)} KB)
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUploadModal(false)} disabled={uploading}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} className="me-2" />
                  Upload Rapor
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Detail Siswa Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detail Siswa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSiswa && (
            <>
              <Row>
                <Col md={6}>
                  <h6 className="fw-bold mb-3">Informasi Siswa</h6>
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td className="text-muted">Nama</td>
                        <td className="fw-medium">: {selectedSiswa.nama}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">NIS</td>
                        <td className="fw-medium">: {selectedSiswa.nis || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Kelas</td>
                        <td className="fw-medium">: {selectedSiswa.kelas?.nama_kelas || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Tanggal Lahir</td>
                        <td className="fw-medium">
                          : {selectedSiswa.tgl_lahir 
                              ? new Date(selectedSiswa.tgl_lahir).toLocaleDateString('id-ID')
                              : '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Status</td>
                        <td>
                          <Badge bg={selectedSiswa.status === 'AKTIF' ? 'success' : 'secondary'}>
                            {selectedSiswa.status || 'AKTIF'}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold mb-3">Rapor Siswa</h6>
                  {getSiswaRapor(selectedSiswa.id).length > 0 ? (
                    <Table bordered size="sm">
                      <thead className="table-light">
                        <tr>
                          <th>Semester</th>
                          <th>Tahun Ajaran</th>
                          <th>File</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSiswaRapor(selectedSiswa.id).map(rapor => (
                          <tr key={rapor.id}>
                            <td>Semester {rapor.semester}</td>
                            <td>{rapor.tahun_ajaran}</td>
                            <td>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                as="a"
                                href={`${import.meta.env.VITE_API_URL}/storage/${rapor.rapor_files[0].file_path || '#'}`}
                                target="_blank"
                              >
                                <Eye size={12} className="me-1" />
                                Lihat
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Alert variant="warning">
                      Belum ada rapor untuk siswa ini
                    </Alert>
                  )}
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

// Table Components
function TableSiswa({ data, isWaliKelas, onUpload, onViewDetail, getSiswaRapor }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <Table hover responsive>
        <thead className="table-light">
          <tr>
            <th>No</th>
            <th>Nama Siswa</th>
            <th>NIS</th>
            <th>Kelas</th>
            <th>Tanggal Lahir</th>
            <th>Status</th>
            {isWaliKelas && <th>Rapor</th>}
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((siswa, index) => {
              const raporCount = getSiswaRapor(siswa.id).length;
              return (
                <tr key={siswa.id}>
                  <td>{index + 1}</td>
                  <td className="fw-medium">{siswa.nama}</td>
                  <td>{siswa.nis || '-'}</td>
                  <td>
                    <Badge bg="primary">
                      {siswa.kelas?.nama_kelas || '-'}
                    </Badge>
                  </td>
                  <td>
                    {siswa.tgl_lahir 
                      ? new Date(siswa.tgl_lahir).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '-'}
                  </td>
                  <td>
                    <Badge bg={siswa.status === 'AKTIF' ? 'success' : 'secondary'}>
                      {siswa.status || 'AKTIF'}
                    </Badge>
                  </td>
                  {isWaliKelas && (
                    <td>
                      <Badge bg={raporCount > 0 ? 'info' : 'secondary'}>
                        {raporCount} rapor
                      </Badge>
                    </td>
                  )}
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-2"
                      onClick={() => onViewDetail(siswa)}
                    >
                      <Eye size={14} className="me-1" />
                      Detail
                    </Button>
                    {isWaliKelas && (
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => onUpload(siswa)}
                      >
                        <Upload size={14} className="me-1" />
                        Upload
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={isWaliKelas ? 8 : 7} className="text-center text-muted py-4">
                Tidak ada data siswa
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

function TableRapor({ data, onDelete }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <Table hover responsive>
        <thead className="table-light">
          <tr>
            <th>No</th>
            <th>Nama Siswa</th>
            <th>NIS</th>
            <th>Kelas</th>
            <th>Semester</th>
            <th>Tahun Ajaran</th>
            <th>Tanggal Upload</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((rapor, index) => (
              <tr key={rapor.id}>
                <td>{index + 1}</td>
                <td className="fw-medium">{rapor.siswa?.nama || '-'}</td>
                <td>{rapor.siswa?.nis || '-'}</td>
                <td>
                  <Badge bg="primary">
                    {rapor.siswa?.kelas?.nama_kelas || '-'}
                  </Badge>
                </td>
                <td>Semester {rapor.semester}</td>
                <td>{rapor.tahun_ajaran}</td>
                <td>
                  {rapor.uploaded_at 
                    ? new Date(rapor.uploaded_at).toLocaleDateString('id-ID')
                    : '-'}
                </td>
                <td>
                  {rapor.files && rapor.files.length > 0 && (
                    <>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-2"
                        as="a"
                        href={`${import.meta.env.VITE_API_URL}/storage/${rapor.files[0].file_path || '#'}`}
                        target="_blank"
                      >
                        <Eye size={14} className="me-1" />
                        Lihat
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-success"
                        className="me-2"
                        as="a"
                        href={`${import.meta.env.VITE_API_URL}/storage/${rapor.files[0].file_path || '#'}`}
                        download
                      >
                        <Download size={14} className="me-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => onDelete(rapor.id)}
                      >
                        <Trash size={14} className="me-1" />
                        Hapus
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center text-muted py-4">
                Belum ada rapor yang diupload
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}