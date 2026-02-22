import { useState, useEffect, act } from "react";
import { 
  Container, Row, Col, Card, Table, Button, 
  Modal, Form, Tabs, Tab, Badge, InputGroup, Spinner, Alert 
} from "react-bootstrap";
import { 
  Plus, Pencil, Trash, Search, Eye, Download,
  PersonFill, PeopleFill, BookFill, FileEarmarkText
} from "react-bootstrap-icons";
import { getGuru, createGuru, updateGuru, deleteGuru } from "../../services/guruApi";
import { getKelas, createKelas, updateKelas, deleteKelas } from "../../services/kelasApi";
import { getSiswa, createSiswa, updateSiswa, deleteSiswa } from "../../services/siswaApi";
import { getUsers, updateUser, deleteUser } from "../../services/userApi";
import { getRapor } from "../../services/raporApi";

export default function DataMaster() {
  const [activeTab, setActiveTab] = useState("guru");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usersData, setUsersData] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState("all");
  // Data States
  const [dataGuru, setDataGuru] = useState([]);
  const [dataSiswa, setDataSiswa] = useState([]);
  const [dataKelas, setDataKelas] = useState([]);
  const [dataRapor, setDataRapor] = useState([]);

  // Form States
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === "guru") {
        const response = await getGuru();
        setDataGuru(response.data || []);
      } else if (activeTab === "siswa") {
        const response = await getSiswa();
        const responseKelas = await getKelas();
        setDataSiswa(response.data || []);
        setDataKelas(responseKelas.data || []);
      } else if (activeTab === "kelas") {
        const response = await getKelas();
        setDataKelas(response.data || []);
        
        // Load guru untuk dropdown wali kelas
        const guruResponse = await getGuru();
        setDataGuru(guruResponse.data || []);
      } else if (activeTab === "rapor") {
        const response = await getRapor();
        setDataRapor(response.data || []);
      }else if (activeTab === "users") {
        const response = await getUsers();
        console.log("Users Data:", response.data);
        setUsersData(response.data || []);
       
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setModalMode("add");
    setSelectedItem(null);
    setFormData({});
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setModalMode("edit");
    setSelectedItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    try {
      setLoading(true);
      if (activeTab === "guru") {
        await deleteGuru(id);
      } else if (activeTab === "siswa") {
        await deleteSiswa(id);
      } else if (activeTab === "kelas") {
        await deleteKelas(id);
      } else if (activeTab === "users") {
        await deleteUser(id);
      }
      alert("Data berhasil dihapus!");
      await loadData();
    } catch (error) {
      console.error("Error deleting data:", error);
      alert("Gagal menghapus data!");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (activeTab === "guru") {
        if (modalMode === "add") {
          await createGuru(formData);
        } else {
          await updateGuru(selectedItem.id, formData);
        }
      } else if (activeTab === "siswa") {
        if (modalMode === "add") {
          await createSiswa(formData);
        } else {
          await updateSiswa(selectedItem.id, formData);
        }
      } else if (activeTab === "kelas") {
        if (modalMode === "add") {
          await createKelas(formData);
        } else {
          await updateKelas(selectedItem.id, formData);
        }
      } else if( activeTab === "users") {
        if (modalMode === "edit") {
          await updateUser(selectedItem.id, formData);
        }
      }
      
      alert(`Data berhasil ${modalMode === "add" ? "ditambahkan" : "diperbarui"}!`);
      setShowModal(false);
      await loadData();
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Gagal menyimpan data!");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderForm = () => {
    switch(activeTab) {
      case "guru":
        return <FormGuru formData={formData} onChange={handleInputChange} />;
      case "siswa":
        return <FormSiswa formData={formData} onChange={handleInputChange} dataKelas={dataKelas} />;
      case "kelas":
        return <FormKelas formData={formData} onChange={handleInputChange} dataGuru={dataGuru} />;
      default:
        return null;
    }
  };

  const renderTable = () => {
    switch(activeTab) {
      case "guru":
        return <TableGuru data={dataGuru} onEdit={handleEdit} onDelete={handleDelete} searchTerm={searchTerm} />;
      case "siswa":
        return <TableSiswa data={dataSiswa} onEdit={handleEdit} onDelete={handleDelete} searchTerm={searchTerm} selectedKelas={selectedKelas} />;
      case "kelas":
        return <TableKelas data={dataKelas} onEdit={handleEdit} onDelete={handleDelete} searchTerm={searchTerm} />;
      case "rapor":
        return <TableRapor data={dataRapor} searchTerm={searchTerm} />;
      case "users":
        return <TableUsers data={usersData} onEdit={handleEdit} onDelete={handleDelete} searchTerm={searchTerm} />;
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    const titles = {
      guru: "Guru",
      siswa: "Siswa",
      kelas: "Kelas",
      users: "Users"
    };
    return `${modalMode === "add" ? "Tambah" : "Edit"} Data ${titles[activeTab]}`;
  };

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <h2 className="mb-4 fw-bold">Data Master</h2>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="guru" title={<><PersonFill className="me-2" />Data Guru</>} />
            <Tab eventKey="siswa" title={<><PeopleFill className="me-2" />Data Siswa</>} />
            <Tab eventKey="kelas" title={<><BookFill className="me-2" />Data Kelas</>} />
            <Tab eventKey="rapor" title={<><FileEarmarkText className="me-2" />File Rapor</>} />
            <Tab eventKey="users" title={<><PeopleFill className="me-2" />Data Users</>} />
          </Tabs>

          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Cari data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            { activeTab === "siswa" && (
              <>
              <Col md={2}>
                <Form.Select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                >
                  
                  <option value="all">Semua Kelas</option>
                  {dataKelas.map(kelas => (
                    <option key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas}
                    </option>

                  ))}
                </Form.Select>
              </Col>
                  </>
              
            ) }
            <Col md={activeTab === "siswa" ? 4 : 6} className="text-end">
              {activeTab !== "rapor" && (
                <Button variant="primary" onClick={handleAdd} disabled={loading}>
                  <Plus size={20} className="me-2" />
                  Tambah {activeTab === "guru" ? "Guru" : activeTab === "siswa" ? "Siswa" : activeTab === "kelas" ? "Kelas" : "Users"}
                </Button>
              )}
            </Col>
          </Row>

          {loading && activeTab !== "rapor" ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Memuat data...</p>
            </div>
          ) : (
            renderTable()
          )}
        </Card.Body>
      </Card>

      {/* Modal Form */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{getModalTitle()}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {renderForm()}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

// ============ FORM COMPONENTS ============

function FormGuru({ formData, onChange }) {
  return (
    <Row>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>NIP <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            name="nip"
            value={formData.nip || ""}
            onChange={onChange}
            required
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Nama Lengkap <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            name="nama"
            value={formData.nama || ""}
            onChange={onChange}
            required
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Tanggal Lahir</Form.Label>
          <Form.Control
            type="date"
            name="tgl_lahir"
            value={formData.tgl_lahir || ""}
            onChange={onChange}
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>No. HP</Form.Label>
          <Form.Control
            type="tel"
            name="no_hp"
            value={formData.no_hp || ""}
            onChange={onChange}
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Peran</Form.Label>
          <Form.Control
            type="text"
            name="peran"
            placeholder="Contoh: Guru Matematika"
            value={formData.peran || ""}
            onChange={onChange}
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Tipe Kepegawaian <span className="text-danger">*</span></Form.Label>
          <Form.Select
            name="tipe"
            value={formData.tipe || ""}
            onChange={onChange}
            required
          >
            <option value="">Pilih Tipe</option>
            <option value="tetap">Tetap</option>
            <option value="honorer">Honorer</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Pendidikan Terakhir</Form.Label>
          <Form.Control
            type="text"
            name="pendidikan_terakhir"
            placeholder="Contoh: S1 Pendidikan Matematika"
            value={formData.pendidikan_terakhir || ""}
            onChange={onChange}
          />
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group className="mb-3">
          <Form.Label>Bulan Masuk</Form.Label>
          <Form.Select
            name="bulan_masuk"
            value={formData.bulan_masuk || ""}
            onChange={onChange}
          >
            <option value="">Pilih Bulan</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString('id-ID', { month: 'long' })}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={3}>
        <Form.Group className="mb-3">
          <Form.Label>Tahun Masuk</Form.Label>
          <Form.Control
            type="number"
            name="tahun_masuk"
            placeholder="2020"
            value={formData.tahun_masuk || ""}
            onChange={onChange}
            min="1990"
            max={new Date().getFullYear()}
          />
        </Form.Group>
      </Col>
    </Row>
  );
}

function FormSiswa({ formData, onChange, dataKelas }) {
  return (
    <Row>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>NIS <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            name="nis"
            value={formData.nis || ""}
            onChange={onChange}
            required
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Nama Lengkap <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            name="nama"
            value={formData.nama || ""}
            onChange={onChange}
            required
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Kelas <span className="text-danger">*</span></Form.Label>
          <Form.Select
            name="kelas_id"
            value={formData.kelas_id || ""}
            onChange={onChange}
            required
          >
            <option value="">Pilih Kelas</option>
            {dataKelas.map(kelas => (
              <option key={kelas.id} value={kelas.id}>
                {kelas.nama_kelas}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Tanggal Lahir</Form.Label>
          <Form.Control
            type="date"
            name="tgl_lahir"
            value={formData.tgl_lahir || ""}
            onChange={onChange}
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Status <span className="text-danger">*</span></Form.Label>
          <Form.Select
            name="status"
            value={formData.status || "aktif"}
            onChange={onChange}
            required
          >
            <option value="aktif">Aktif</option>
            <option value="lulus">Lulus</option>
            <option value="pindah">Pindah</option>
            <option value="keluar">Keluar</option>
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>
  );
}

function FormKelas({ formData, onChange, dataGuru }) {
  return (
    <Row>
      <Col md={12}>
        <Form.Group className="mb-3">
          <Form.Label>Nama Kelas <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            name="nama_kelas"
            placeholder="Contoh: XII IPA 1"
            value={formData.nama_kelas || ""}
            onChange={onChange}
            required
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Tingkat <span className="text-danger">*</span></Form.Label>
          <Form.Select
            name="tingkat"
            value={formData.tingkat || 0}
            onChange={onChange}
            required
          >
            <option value="">Pilih Tingkat</option>
            {Array.from({ length: 13 }, (_, i) => (
              <option key={i} value={i} selected={formData.tingkat == i}>
                {i}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label>Wali Kelas</Form.Label>
          <Form.Select
            name="wali_kelas_id"
            value={formData.wali_kelas_id || ""}
            onChange={onChange}
          >
            <option value="">Pilih Wali Kelas</option>
            {dataGuru.map(guru => (
              <option key={guru.id} value={guru.id}>
                {guru.nama}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>
  );
}

// ============ TABLE COMPONENTS ============

function TableGuru({ data, onEdit, onDelete, searchTerm }) {
  const filtered = data.filter(item =>
    item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nip?.includes(searchTerm) ||
    item.peran?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Table hover responsive>
      <thead className="table-light">
        <tr>
          <th>NIP</th>
          <th>Nama</th>
          <th>Peran</th>
          <th>Tipe</th>
          <th>No. HP</th>
          <th>Pendidikan</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length > 0 ? (
          filtered.map((guru) => (
            <tr key={guru.id}>
              <td>{guru.nip}</td>
              <td className="fw-medium">{guru.nama}</td>
              <td>{guru.peran || '-'}</td>
              <td>
                <Badge bg={guru.tipe === "tetap" ? "success" : "info"}>
                  {guru.tipe ? guru.tipe.charAt(0).toUpperCase() + guru.tipe.slice(1) : '-'}
                </Badge>
              </td>
              <td>{guru.no_hp || '-'}</td>
              <td>{guru.pendidikan_terakhir || '-'}</td>
              <td>
                <Button
                  size="sm"
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => onEdit(guru)}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => onDelete(guru.id)}
                >
                  <Trash size={14} />
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="text-center text-muted py-4">
              Tidak ada data guru
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}

function TableSiswa({ data, onEdit, onDelete, searchTerm, selectedKelas }) {
  const filtered = data.filter(item => {
  // 1. Logika Filter Search (Nama, NIS, atau Nama Kelas)
  const matchesSearch = 
      item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nis?.includes(searchTerm) ||
      item.kelas?.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Logika Filter Dropdown Kelas
    // Jika selectedKelas kosong (misal: "Semua Kelas"), anggap semua cocok
    const matchesKelas = selectedKelas === "all" || String(item.kelas_id) === String(selectedKelas);

    // 3. Gabungkan keduanya dengan AND (&&)
    return matchesSearch && matchesKelas;
  });

  return (
    <Table hover responsive>
      <thead className="table-light">
        <tr>
          <th>NIS</th>
          <th>Nama</th>
          <th>Kelas</th>
          <th>Tanggal Lahir</th>
          <th>Status</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length > 0 ? (
          filtered.map((siswa) => (
            <tr key={siswa.id}>
              <td>{siswa.nis}</td>
              <td className="fw-medium">{siswa.nama}</td>
              <td>
                <Badge bg="primary">
                  {siswa.kelas?.nama_kelas || '-'}
                </Badge>
              </td>
              <td>
                {siswa.tgl_lahir 
                  ? new Date(siswa.tgl_lahir).toLocaleDateString('id-ID')
                  : '-'
                }
              </td>
              <td>
                <Badge bg={
                  siswa.status === 'aktif' ? 'success' :
                  siswa.status === 'lulus' ? 'primary' :
                  siswa.status === 'pindah' ? 'warning' : 'danger'
                }>
                  {siswa.status ? siswa.status.charAt(0).toUpperCase() + siswa.status.slice(1) : 'Aktif'}
                </Badge>
              </td>
              <td>
                <Button
                  size="sm"
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => onEdit(siswa)}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => onDelete(siswa.id)}
                >
                  <Trash size={14} />
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="text-center text-muted py-4">
              Tidak ada data siswa
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}

function TableKelas({ data, onEdit, onDelete, searchTerm }) {
  const filtered = data.filter(item =>
    item.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.wali_kelas?.nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Table hover responsive>
      <thead className="table-light">
        <tr>
          <th>Nama Kelas</th>
          <th>Tingkat</th>
          <th>Wali Kelas</th>
          <th>Jumlah Siswa</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length > 0 ? (
          filtered.map((kelas) => (
            <tr key={kelas.id}>
              <td className="fw-medium">{kelas.nama_kelas}</td>
              <td><Badge bg="secondary">{kelas.tingkat}</Badge></td>
              <td>{kelas.guru?.nama || '-'}</td>
              <td>
                <Badge bg="info">
                  {kelas.siswa?.length || 0} siswa
                </Badge>
              </td>
              <td>
                <Button
                  size="sm"
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => onEdit(kelas)}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => onDelete(kelas.id)}
                >
                  <Trash size={14} />
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="text-center text-muted py-4">
              Tidak ada data kelas
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}

function TableRapor({ data, searchTerm }) {
  const filtered = data.filter(item =>
    item.siswa?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tahun_ajaran?.includes(searchTerm)
  );
  console.log("Filtered Rapor:", filtered);
  return (
    <Table hover responsive>
      <thead className="table-light">
        <tr>
          <th>Siswa</th>
          <th>Kelas</th>
          <th>Semester</th>
          <th>Tahun Ajaran</th>
          <th>Tanggal Upload</th>
          <th>File</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length > 0 ? (
          filtered.map((rapor) => (
            <tr key={rapor.id}>
              <td className="fw-medium">{rapor.siswa?.nama || '-'}</td>
              <td>
                <Badge bg="primary">
                  {rapor.siswa?.kelas?.nama_kelas || '-'}
                </Badge>
              </td>
              <td>{rapor.semester.nama || '-'}</td>
              <td>{rapor.tahun_ajaran || '-'}</td>
              <td>
                {rapor.uploaded_at 
                  ? new Date(rapor.uploaded_at).toLocaleDateString('id-ID')
                  : '-'
                }
              </td>
              <td>
                <Badge bg="secondary">
                  {rapor.rapor_files?.length || 0} file
                </Badge>
              </td>
              <td>
                {rapor.rapor_files && rapor.rapor_files.length > 0 && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline-primary" 
                      className="me-2"
                      as="a"
                      href={`${import.meta.env.VITE_API_URL}/storage/${rapor.rapor_files[0].file_path || '#'}`}
                      target="_blank"
                    >
                      <Eye size={14} className="me-1" />
                      Lihat
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline-success"
                      as="a"
                      href={`${import.meta.env.VITE_API_URL}/storage/${rapor.rapor_files[0].file_path || '#'}`}
                      download
                    >
                      <Download size={14} className="me-1" />
                      Download
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="text-center text-muted py-4">
              Tidak ada data rapor
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}
function TableUsers({ data, onEdit, onDelete, searchTerm }) {
  const filtered = data.filter(item =>
    item.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Table hover responsive>
      <thead className="table-light">
        <tr>
          <th>Username</th>
          <th>Role</th>
          <th>Tanggal Lahir</th>
          <th>Last Login</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {filtered.length > 0 ? (
          filtered.map((user) => (
            <tr key={user.id}>
              <td className="fw-medium">{user.username || '-'}</td>
              <td>
                <Badge bg="primary">
                  {user.role.nama || '-'}
                </Badge>
              </td>
              <td>{user.role.id === 6 ? user.siswa.tgl_lahir : user.guru.tgl_lahir == null ? '-' : user.guru.tgl_lahir}</td>
              <td>{user.last_login || '-'}</td>

              <td>
                <Button
                  size="sm"
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => onEdit(user)}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => onDelete(user.id)}
                >
                  <Trash size={14} />
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="text-center text-muted py-4">
              Tidak ada data rapor
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}