import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Form,
  InputGroup,
  Modal,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  Search,
  Plus,
  Eye,
  Trash,
  FileEarmarkText,
  CashCoin,
  People
} from "react-bootstrap-icons";
import { 
  getTagihanSpp as getTagihan, 
  createTagihanSpp as createTagihan, 
  bulkCreateTagihan, 
  deleteTagihanSpp as deleteTagihan 
} from "../../services/sppApi";
import { getSiswa } from "../../services/siswaApi";
import { getSemester } from "../../services/semesterApi";
import { getKelas } from "../../services/kelasApi";
import AddTagihanModal from "../../components/addTagihanModal";

export default function TagihanNonBulanan({ jenisTagihan }) {
  const [loading, setLoading] = useState(true);
  const [tagihanData, setTagihanData] = useState([]);
  const [semesterList, setSemesterList] = useState([]);
  const [semesterAktif, setSemesterAktif] = useState(null);
  const [kelasList, setKelasList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);

  const [filterKelas, setFilterKelas] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTagihan, setSelectedTagihan] = useState(null);
  
  const getBulanNama = (bulan) => {
    const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return namaBulan[parseInt(bulan) - 1] || '';
  };  
  const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
  const [formData, setFormData] = useState({
    jenis_tagihan: jenisTagihan,
    bulan: "",
    siswa_id: "",
    semester_id: "",
    tahun: new Date().getFullYear(),
    periode: "",
    nominal_tagihan: "",
    batas_bayar: ""
  });

  const [bulkFormData, setBulkFormData] = useState({
    jenis_tagihan: jenisTagihan,
    semester_id: "",
    kelas_id: "",
    tahun: new Date().getFullYear(),
    periode: "",
    nominal_tagihan: "",
  });

  const jenisLabels = {
    facility_fee: "Facility Fee",
    material_fee: "Material Fee",
    paces: "PACEs",
    miscellaneous: "Miscellaneous"
  };

  const currentLabel = jenisLabels[jenisTagihan] || jenisTagihan;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTagihan();
  }, [jenisTagihan, filterKelas, filterStatus, selectedYear]);

  const loadInitialData = async () => {
    try {
      const [semesterRes, kelasRes, siswaRes] = await Promise.all([
        getSemester(),
        getKelas(),
        getSiswa()
      ]);

      setSemesterList(semesterRes.data || []);
      setKelasList(kelasRes.data || []);
      setSiswaList(siswaRes.data || []);

      const aktif = semesterRes.data.find(s => s.is_aktif);
      setSemesterAktif(aktif);
      if (aktif) {
        setFormData(prev => ({ ...prev, semester_id: aktif.id }));
        setBulkFormData(prev => ({ ...prev, semester_id: aktif.id }));
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const loadTagihan = async () => {
    try {
      setLoading(true);
      const params = {
        jenis_tagihan: jenisTagihan,
        tahun: selectedYear
      };

      if (filterStatus !== "all") {
        params.status = filterStatus;
      }

      const response = await getTagihan(params);
      let filtered = response.data.data || [];

      if (filterKelas !== "all") {
        filtered = filtered.filter(t => t.siswa?.kelas_id === parseInt(filterKelas));
      }

      setTagihanData(filtered);
      console.log("Type of tagihanData:", typeof tagihanData, tagihanData);
    } catch (error) {
      console.error("Error loading tagihan:", error);
      alert("Gagal memuat data tagihan!");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log("Submitting formData:", formData);

      await createTagihan({
        ...formData,
        jenis_tagihan: jenisTagihan
      });
      setShowAddModal(false);
      loadTagihan();
      resetForm();
      alert("Tagihan berhasil ditambahkan!");
    } catch (error) {
      console.error("Error creating tagihan:", error);
      alert("Gagal menambahkan tagihan!");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await bulkCreateTagihan({
        ...bulkFormData,
        jenis_tagihan: jenisTagihan
      });
      setShowBulkModal(false);
      loadTagihan();
      resetBulkForm();
      alert(response.data.message || "Tagihan berhasil dibuat!");
    } catch (error) {
      console.error("Error bulk creating:", error);
      alert("Gagal membuat tagihan!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus tagihan ini?")) return;

    try {
      await deleteTagihan(id);
      loadTagihan();
      alert("Tagihan berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting:", error);
      alert(error.response?.data?.message || "Gagal menghapus tagihan!");
    }
  };

  const handleViewDetail = (tagihan) => {
    setSelectedTagihan(tagihan);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      siswa_id: "",
      semester_id: semesterAktif?.id || "",
      tahun: new Date().getFullYear(),
      periode: "",
      nominal_tagihan: "",
      batas_bayar: ""
    });
  };

  const resetBulkForm = () => {
    setBulkFormData({
      semester_id: semesterAktif?.id || "",
      kelas_id: "",
      tahun: new Date().getFullYear(),
      periode: "",
      nominal_tagihan: "",
      batas_bayar: ""
    });
  };
const isOverdue = (batasBayar) => {
  if (!batasBayar) return false;
  return new Date(batasBayar) < new Date();
};
const filteredData = (tagihanData || []).filter(t =>
  t.siswa?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  t.siswa?.nis?.includes(searchTerm)
);
  const stats = {
    total: filteredData.length,
    lunas: filteredData.filter(t => t.status === "LUNAS").length,
    belumLunas: filteredData.filter(t => t.status === "BELUM_BAYAR").length,
    totalTagihan: filteredData.reduce((sum, t) => sum + parseFloat(t.nominal_tagihan || 0), 0),
    totalDibayar: filteredData.reduce((sum, t) => sum + parseFloat(t.total_dibayar || 0), 0),
    totalSisa: filteredData.reduce((sum, t) => sum + parseFloat(t.sisa || 0), 0),
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <h2 className="mb-4 fw-bold">Tagihan {currentLabel}</h2>

      {semesterAktif && (
        <Alert variant="info" className="mb-3">
          <strong>Semester Aktif:</strong> {semesterAktif.nama} - {semesterAktif.tahun_ajaran}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Total Tagihan</p>
                  <h3 className="mb-0 fw-bold text-primary">{stats.total}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                  <FileEarmarkText size={28} className="text-primary" />
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
                  <p className="text-muted mb-1 small">Lunas</p>
                  <h3 className="mb-0 fw-bold text-success">{stats.lunas}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-3">
                  <CashCoin size={28} className="text-success" />
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
                  <p className="text-muted mb-1 small">Belum Lunas</p>
                  <h3 className="mb-0 fw-bold text-warning">{stats.belumLunas}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded-3">
                  <CashCoin size={28} className="text-warning" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div>
                <p className="text-muted mb-1 small">Total Sisa</p>
                <h5 className="mb-0 fw-bold text-danger">{formatRupiah(stats.totalSisa)}</h5>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Card */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {/* Filters & Actions */}
          <Row className="mb-3 align-items-center">
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Cari siswa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
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
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
              >
                <option value="all">Semua Kelas</option>
                {kelasList.map(kelas => (
                  <option key={kelas.id} value={kelas.id}>{kelas.nama}</option>
                ))}
              </Form.Select>
            </Col>

            <Col md={2}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="lunas">Lunas</option>
                <option value="belum_bayar">Belum Lunas</option>
              </Form.Select>
            </Col>

            <Col md={3} className="text-end">
              <Button
                variant="success"
                className="me-2"
                size="sm"
                onClick={() => setShowBulkModal(true)}
              >
                <Plus size={16} className="me-1" />
                Buat Massal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={16} className="me-1" />
                Tambah
              </Button>
            </Col>
          </Row>

          {/* Table */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Memuat data...</p>
            </div>
          ) : (
            <Table hover responsive>
              <thead className="table-light">
                <tr>
                  <th style={{width: '50px'}}>No</th>
                  <th style={{width: '100px'}}>NIS</th>
                  <th>Nama Siswa</th>
                  <th style={{width: '100px'}}>Kelas</th>
                  <th style={{width: '120px'}}>Periode</th>
                  <th style={{width: '80px'}}>Tahun</th>
                  <th style={{width: '120px'}}>Batas Bayar</th> 
                  <th className="text-end" style={{width: '130px'}}>Nominal</th>
                  <th className="text-end" style={{width: '130px'}}>Dibayar</th>
                  <th className="text-end" style={{width: '130px'}}>Sisa</th>
                  <th className="text-center" style={{width: '100px'}}>Status</th>
                  <th className="text-center" style={{width: '100px'}}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((tagihan, index) => (
                    <tr key={tagihan.id}>
                      <td>{index + 1}</td>
                      <td>{tagihan.siswa?.nis || '-'}</td>
                      <td className="fw-medium">{tagihan.siswa?.nama || '-'}</td>
                      <td>{tagihan.siswa?.kelas?.nama_kelas || '-'}</td>
                      <td>{tagihan.periode || '-'}</td>
                      <td>{tagihan.tahun}</td>
                      <td>
                        {tagihan.batas_bayar ? (
                          <div>
                            <div className={isOverdue(tagihan.batas_bayar) && tagihan.status !== 'lunas' ? 'text-danger fw-bold' : ''}>
                              {new Date(tagihan.batas_bayar).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            {isOverdue(tagihan.batas_bayar) && tagihan.status !== 'lunas' && (
                              <Badge bg="danger" className="mt-1">Terlambat</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-end">{formatRupiah(tagihan.nominal_tagihan)}</td>
                      <td className="text-end text-success fw-medium">{formatRupiah(tagihan.total_dibayar)}</td>
                      <td className="text-end text-danger fw-bold">{formatRupiah(tagihan.sisa)}</td>
                      <td className="text-center">
                        <Badge bg={tagihan.status === "LUNAS" ? "success" : "warning"}>
                          {tagihan.status === "LUNAS" ? "Lunas" : "Belum Lunas"}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="me-1"
                          onClick={() => handleViewDetail(tagihan)}
                        >
                          <Eye size={14} />
                        </Button>
                        {tagihan.total_dibayar <= 0 && (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDelete(tagihan.id)}
                          >
                            <Trash size={14} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center text-muted py-4">
                      Tidak ada data tagihan
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="table-light">
                  <tr>
                    <td colSpan="6" className="text-end fw-bold">TOTAL:</td>
                    <td className="text-end fw-bold">{formatRupiah(stats.totalTagihan)}</td>
                    <td className="text-end fw-bold text-success">{formatRupiah(stats.totalDibayar)}</td>
                    <td className="text-end fw-bold text-danger">{formatRupiah(stats.totalSisa)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add Modal */}
      <AddTagihanModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        formData={formData}
        setFormData={setFormData}
        siswaList={siswaList}
        semesterList={semesterList}
        onSubmit={handleAdd}
        currentLabel={currentLabel}
        formatRupiah={formatRupiah}
        namaBulan={namaBulan}
        loading={loading}
      />

      {/* Bulk Modal */}
      <BulkTagihanModal
        show={showBulkModal}
        onHide={() => setShowBulkModal(false)}
        formData={bulkFormData}
        setFormData={setBulkFormData}
        kelasList={kelasList}
        semesterList={semesterList}
        onSubmit={handleBulkCreate}
        currentLabel={currentLabel}
        formatRupiah={formatRupiah}
      />

      {/* Detail Modal */}
      <DetailTagihanModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        tagihan={selectedTagihan}
        formatRupiah={formatRupiah}
        currentLabel={currentLabel}
        isOverdue={isOverdue}
      />
    </Container>
  );
}

// Simple modals (reuse dari Tagihan_Complete.jsx tapi simplified)
// function AddTagihanModal({ show, onHide, formData, setFormData, siswaList, semesterList, onSubmit, currentLabel, formatRupiah, namaBulan }) {
//   return (
//     <Modal show={show} onHide={onHide} size="lg">
//       <Modal.Header closeButton>
//         <Modal.Title>Tambah Tagihan {currentLabel}</Modal.Title>
//       </Modal.Header>
//       <Form onSubmit={onSubmit}>
//         <Modal.Body>
//           <Row>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Siswa <span className="text-danger">*</span></Form.Label>
//                 <Form.Select
//                   value={formData.siswa_id}
//                   onChange={(e) => setFormData({ ...formData, siswa_id: e.target.value })}
//                   required
//                 >
//                   <option value="">Pilih Siswa</option>
//                   {siswaList.map(siswa => (
//                     <option key={siswa.id} value={siswa.id}>
//                       {siswa.nis} - {siswa.nama}
//                     </option>
//                   ))}
//                 </Form.Select>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Semester <span className="text-danger">*</span></Form.Label>
//                 <Form.Select
//                   value={formData.semester_id}
//                   onChange={(e) => setFormData({ ...formData, semester_id: e.target.value })}
//                   required
//                 >
//                   <option value="">Pilih Semester</option>
//                   {semesterList.map(sem => (
//                     <option key={sem.id} value={sem.id}>
//                       {sem.nama} - {sem.tahun_ajaran}
//                     </option>
//                   ))}
//                 </Form.Select>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Periode</Form.Label>
//                 <Form.Select
//                   value={formData.periode}
//                   onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
//                 >
//                   <option value="">Pilih Periode</option>
//                   <option value="Semester 1">Semester 1</option>
//                   <option value="Semester 2">Semester 2</option>
//                   <option value="Tahunan">Tahunan</option>
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//             <Col md={4}>
//                 <Form.Label>Bulan</Form.Label>
//                 <Form.Select
//                   value={formData.bulan}
//                   onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
//                 >
//                   <option value="">Pilih bulan</option>
//                   {namaBulan.map((bulan, index) => (
//                     <option key={index+1} value={index + 1}>{bulan}</option>
//                   ))}
//                 </Form.Select>
//             </Col>      
//             <Col md={2}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Tahun <span className="text-danger">*</span></Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={formData.tahun}
//                   onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
//                   required
//                   min="2020"
//                   max="2030"
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Batas Bayar</Form.Label>
//                 <Form.Control
//                   type="date"
//                   value={formData.batas_bayar}
//                   onChange={(e) => setFormData({ ...formData, batas_bayar: e.target.value })}
//                   min={new Date().toISOString().split('T')[0]}
//                 />
//                 <Form.Text className="text-muted">
//                   Kosongkan jika tidak ada batas waktu
//                 </Form.Text>
//               </Form.Group>
//             </Col>        
//             <Col md={12}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Nominal Tagihan <span className="text-danger">*</span></Form.Label>
//                 <InputGroup>
//                   <InputGroup.Text>Rp</InputGroup.Text>
//                   <Form.Control
//                     type="number"
//                     value={formData.nominal_tagihan}
//                     onChange={(e) => setFormData({ ...formData, nominal_tagihan: e.target.value })}
//                     required
//                     min="0"
//                   />
//                 </InputGroup>
//                 {formData.nominal_tagihan && (
//                   <Form.Text className="text-muted">
//                     {formatRupiah(formData.nominal_tagihan)}
//                   </Form.Text>
//                 )}
//               </Form.Group>
//             </Col>
            
//           </Row>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={onHide}>Batal</Button>
//           <Button variant="primary" type="submit">Simpan</Button>
//         </Modal.Footer>
//       </Form>
//     </Modal>
//   );
// }

function BulkTagihanModal({ show, onHide, formData, setFormData, kelasList, semesterList, onSubmit, currentLabel, formatRupiah }) {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Buat Tagihan {currentLabel} Massal</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Alert variant="info">
            Tagihan akan dibuat untuk semua siswa di kelas yang dipilih.
          </Alert>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Semester <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={formData.semester_id}
                  onChange={(e) => setFormData({ ...formData, semester_id: e.target.value })}
                  required
                >
                  <option value="">Pilih Semester</option>
                  {semesterList.map(sem => (
                    <option key={sem.id} value={sem.id}>{sem.nama} - {sem.tahun_ajaran}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Kelas</Form.Label>
                <Form.Select
                  value={formData.kelas_id}
                  onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
                >
                  <option value="">Semua Kelas</option>
                  {kelasList.map(kelas => (
                    <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Periode</Form.Label>
                <Form.Select
                  value={formData.periode}
                  onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                >
                  <option value="">Pilih Periode</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Tahunan">Tahunan</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tahun <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  value={formData.tahun}
                  onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Batas Bayar</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.batas_bayar}
                  onChange={(e) => setFormData({ ...formData, batas_bayar: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Form.Text className="text-muted">
                  Akan berlaku untuk semua tagihan
                </Form.Text>
              </Form.Group>
            </Col>        
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Nominal Tagihan <span className="text-danger">*</span></Form.Label>
                <InputGroup>
                  <InputGroup.Text>Rp</InputGroup.Text>
                  <Form.Control
                    type="number"
                    value={formData.nominal_tagihan}
                    onChange={(e) => setFormData({ ...formData, nominal_tagihan: e.target.value })}
                    required
                  />
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Batal</Button>
          <Button variant="success" type="submit">Buat Tagihan</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

function DetailTagihanModal({ show, onHide, tagihan, formatRupiah, currentLabel, isOverdue }) {
  if (!tagihan) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Detail Tagihan {currentLabel}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6}>
            <h6 className="fw-bold mb-3">Informasi Siswa</h6>
            <Table borderless size="sm">
              <tbody>
                <tr>
                  <td className="text-muted" style={{width: '40%'}}>NIS</td>
                  <td className="fw-medium">: {tagihan.siswa?.nis || '-'}</td>
                </tr>
                <tr>
                  <td className="text-muted">Nama</td>
                  <td className="fw-medium">: {tagihan.siswa?.nama || '-'}</td>
                </tr>
                <tr>
                  <td className="text-muted">Kelas</td>
                  <td className="fw-medium">: {tagihan.siswa?.kelas?.nama || '-'}</td>
                </tr>
              </tbody>
            </Table>
          </Col>

          <Col md={6}>
            <h6 className="fw-bold mb-3">Informasi Tagihan</h6>
            <Table borderless size="sm">
              <tbody>
                <tr>
                  <td className="text-muted" style={{width: '40%'}}>Jenis</td>
                  <td className="fw-medium">: {currentLabel}</td>
                </tr>
                <tr>
                  <td className="text-muted">Periode</td>
                  <td className="fw-medium">: {tagihan.periode || '-'}</td>
                </tr>
                <tr>
                  <td className="text-muted">Tahun</td>
                  <td className="fw-medium">: {tagihan.tahun}</td>
                </tr>
                <tr>
                  <td className="text-muted">Batas Bayar</td>
                  <td className={isOverdue ? "fw-bold text-danger" : "fw-medium"}>
                    : {tagihan.batas_bayar ? (
                      <>
                        {new Date(tagihan.batas_bayar).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                        {isOverdue && (
                          <Badge bg="danger" className="ms-2">Terlambat</Badge>
                        )}
                      </>
                    ) : '-'}
                  </td>
                </tr>
              </tbody>
            </Table>
          </Col>

          <Col md={12}>
            <hr />
            <h6 className="fw-bold mb-3">Rincian Pembayaran</h6>
          </Col>

          <Col md={12}>
            <Card className="bg-light border-0">
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <p className="text-muted mb-1 small">Nominal Tagihan</p>
                    <h5 className="fw-bold text-primary">{formatRupiah(tagihan.nominal_tagihan)}</h5>
                  </Col>
                  <Col md={4}>
                    <p className="text-muted mb-1 small">Total Dibayar</p>
                    <h5 className="fw-bold text-success">{formatRupiah(tagihan.total_dibayar)}</h5>
                  </Col>
                  <Col md={4}>
                    <p className="text-muted mb-1 small">Sisa Tagihan</p>
                    <h5 className="fw-bold text-danger">{formatRupiah(tagihan.sisa)}</h5>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>


          <Col md={12} className="mt-3">
            <div className="d-flex justify-content-between align-items-center">
              <Badge bg={tagihan.status === "lunas" ? "success" : "warning"} className="p-2">
                {tagihan.status === "lunas" ? "LUNAS" : "BELUM LUNAS"}
              </Badge>
              <small className="text-muted">
                Dibuat: {new Date(tagihan.created_at).toLocaleDateString('id-ID')}
              </small>
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Tutup</Button>
      </Modal.Footer>
    </Modal>
  );
}