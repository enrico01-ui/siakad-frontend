import { useState, useEffect } from "react";
import { 
  Container, Row, Col, Card, Table, Badge, Button, 
  Form, InputGroup, Spinner, Alert, Modal 
} from "react-bootstrap";
import { 
  Search, Download, FileEarmarkExcel, Eye,
  CashStack, Calendar, People, CheckCircle, Plus
} from "react-bootstrap-icons";
import { getTagihanSpp as getTagihan, createTagihanSpp as createTagihan, bulkCreateTagihan, deleteTagihanSpp as deletTagihan } from "../../services/sppApi";
import { getKelas } from "../../services/kelasApi";
import { getSemester } from "../../services/semesterApi";
import { getSiswa } from "../../services/siswaApi";

export default function TuitionFee() {
  const [loading, setLoading] = useState(true);
  const [tagihanData, setTagihanData] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [semesterList, setSemesterList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [semesterAktif, setSemesterAktif] = useState(null);
  const [selectedKelas, setSelectedKelas] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSetNominalModal, setShowSetNominalModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [nominalForm, setNominalForm] = useState({
    siswa_id: "",
    semester_id: "",
    nominal_per_bulan: "",
    bulan_mulai: "10",
    bulan_selesai: "6"
  });

  const BULAN_AJARAN = [10, 11, 12, 1, 2, 3, 4, 5, 6];
  const NAMA_BULAN = {
    1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April', 
    5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
    9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSemester) {
      loadTagihan();
    }
  }, [selectedKelas, selectedSemester]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [kelasRes, semesterRes, siswaRes] = await Promise.all([
        getKelas(),
        getSemester(),
        getSiswa()
      ]);

      setKelasList(kelasRes.data || []);
      setSemesterList(semesterRes.data || []);
      setSiswaList(siswaRes.data || []);
      
      const aktif = semesterRes.data.find(s => s.is_aktif);
      if (aktif) {
        setSemesterAktif(aktif);
        setSelectedSemester(aktif.id.toString());
        setNominalForm(prev => ({ ...prev, semester_id: aktif.id.toString() }));
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTagihan = async () => {
    try {
      setLoading(true);
      const response = await getTagihan({
        jenis_tagihan: 'tuition_fee',
        semester_id: selectedSemester
      });
      
      const groupedData = groupBySiswa(response.data.data || []);
      console.log("Grouped Tagihan Data:", groupedData);
      setTagihanData(groupedData);
    } catch (error) {
      console.error("Error loading tagihan:", error);
      alert("Gagal memuat data tagihan!");
    } finally {
      setLoading(false);
    }
  };

  const groupBySiswa = (data) => {
    const grouped = {};
    
    data.forEach(tagihan => {
      const siswaId = tagihan.siswa_id;
      
      if (!grouped[siswaId]) {
        grouped[siswaId] = {
          siswa: tagihan.siswa,
          tagihan: {},
          totalTagihan: 0,
          totalDibayar: 0
        };
      }

      const bulan = tagihan.bulan;
      grouped[siswaId].tagihan[bulan] = {
        id: tagihan.id,
        nominal: tagihan.nominal_tagihan,
        dibayar: tagihan.total_dibayar,
        sisa: tagihan.sisa,
        status: tagihan.status
      };

      grouped[siswaId].totalTagihan += parseFloat(tagihan.nominal_tagihan);
      grouped[siswaId].totalDibayar += parseFloat(tagihan.total_dibayar);
    });

    return Object.values(grouped);
  };

  const handleOpenSetNominal = () => {
    setNominalForm({
      siswa_id: "",
      semester_id: selectedSemester || "",
      nominal_per_bulan: "",
      bulan_mulai: "10",
      bulan_selesai: "6"
    });
    setShowSetNominalModal(true);
  };

  const handleSetNominal = async (e) => {
    e.preventDefault();
    
    if (!nominalForm.siswa_id || !nominalForm.semester_id || !nominalForm.nominal_per_bulan) {
      alert("Semua field harus diisi!");
      return;
    }

    try {
      setProcessing(true);

      const bulanMulai = parseInt(nominalForm.bulan_mulai);
      const bulanSelesai = parseInt(nominalForm.bulan_selesai);
      const bulanArray = [];
      
      for (let i = bulanMulai; i <= 12; i++) bulanArray.push(i);
      for (let i = 1; i <= bulanSelesai; i++) bulanArray.push(i);

      // Create tagihan untuk setiap bulan
      for (const bulan of bulanArray) {
        await createTagihan({
          siswa_id: nominalForm.siswa_id,
          semester_id: nominalForm.semester_id,
          jenis_tagihan: 'tuition_fee',
          bulan: bulan,
          tahun: new Date().getFullYear(),
          nominal_tagihan: parseInt(nominalForm.nominal_per_bulan)
        });
      }

      alert("Tagihan berhasil dibuat!");
      setShowSetNominalModal(false);
      loadTagihan();
    } catch (error) {
      console.error("Error creating tagihan:", error);
      alert(error.response?.data?.message || "Gagal membuat tagihan!");
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetail = (siswaData) => {
    setSelectedSiswa(siswaData);
    setShowDetailModal(true);
  };

  const exportToExcel = () => {
    let csv = "No,Nama Siswa,NIS,Kelas,";
    csv += BULAN_AJARAN.map(b => NAMA_BULAN[b]).join(",");
    csv += ",Total Dibayar\n";

    filteredData.forEach((data, idx) => {
      csv += `${idx + 1},${data.siswa.nama},${data.siswa.nis || '-'},${data.siswa.kelas?.nama || '-'},`;
      csv += BULAN_AJARAN.map(bulan => {
        const t = data.tagihan[bulan];
        return t ? t.dibayar : 0;
      }).join(",");
      csv += `,${data.totalDibayar}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tuition-fee-${semesterAktif?.nama || 'export'}.csv`;
    a.click();
  };

  const filteredData = tagihanData.filter(data => {
    const matchesSearch = 
      data.siswa?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.siswa?.nis?.includes(searchTerm);
    const matchesKelas = selectedKelas === "all" || String(data.siswa?.kelas_id) === String(selectedKelas);
    return matchesSearch && matchesKelas;
  });

  const stats = {
    totalSiswa: filteredData.length,
    totalTagihan: filteredData.reduce((sum, d) => sum + d.totalTagihan, 0),
    totalDibayar: filteredData.reduce((sum, d) => sum + d.totalDibayar, 0),
    lunas: filteredData.filter(d => d.totalTagihan === d.totalDibayar && d.totalTagihan > 0).length
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
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-0 fw-bold">Rekap Tagihan Tuition Fee</h2>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={handleOpenSetNominal} className="me-2">
            <Plus size={18} className="me-2" />
            Set Nominal Tagihan
          </Button>
          <Button variant="success" onClick={exportToExcel}>
            <FileEarmarkExcel size={18} className="me-2" />
            Export Excel
          </Button>
        </Col>
      </Row>

      {semesterAktif && (
        <Alert variant="info" className="mb-3">
          <strong>Semester:</strong> {semesterAktif.nama} - {semesterAktif.tahun_ajaran}
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col lg={3} md={6}>
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
        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Total Tagihan</p>
                  <h4 className="mb-0 fw-bold text-info">{formatRupiah(stats.totalTagihan)}</h4>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded-3">
                  <Calendar size={28} className="text-info" />
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
                  <p className="text-muted mb-1 small">Total Dibayar</p>
                  <h4 className="mb-0 fw-bold text-success">{formatRupiah(stats.totalDibayar)}</h4>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-3">
                  <CashStack size={28} className="text-success" />
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
                  <p className="text-muted mb-1 small">Siswa Lunas</p>
                  <h3 className="mb-0 fw-bold text-warning">{stats.lunas}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded-3">
                  <CheckCircle size={28} className="text-warning" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
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
            <Col md={4}>
              <Form.Select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
              >
                <option value="all">Semua Kelas</option>
                {kelasList.map(kelas => (
                  <option key={kelas.id} value={kelas.id}>
                    {kelas.nama_kelas}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="">Pilih Semester</option>
                {semesterList.map(sem => (
                  <option key={sem.id} value={sem.id}>
                    {sem.nama} - {sem.tahun_ajaran}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Main Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Memuat data...</p>
            </div>
          ) : (
            <Table hover bordered responsive size="sm" style={{ minWidth: '1400px' }}>
              <thead className="table-light">
                <tr>
                  <th rowSpan="2" className="text-center align-middle" style={{ width: '50px' }}>No</th>
                  <th rowSpan="2" className="align-middle" style={{ width: '200px' }}>Nama Siswa</th>
                  <th rowSpan="2" className="text-center align-middle" style={{ width: '100px' }}>NIS</th>
                  <th rowSpan="2" className="text-center align-middle" style={{ width: '80px' }}>Kelas</th>
                  <th colSpan={BULAN_AJARAN.length} className="text-center">Pembayaran Per Bulan</th>
                  <th rowSpan="2" className="text-center align-middle" style={{ width: '120px' }}>Total Dibayar</th>
                  <th rowSpan="2" className="text-center align-middle" style={{ width: '100px' }}>Aksi</th>
                </tr>
                <tr>
                  {BULAN_AJARAN.map(bulan => (
                    <th key={bulan} className="text-center" style={{ width: '100px' }}>
                      {NAMA_BULAN[bulan]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((data, idx) => (
                    <tr key={data.siswa.id}>
                      <td className="text-center">{idx + 1}</td>
                      <td className="fw-medium">{data.siswa.nama}</td>
                      <td className="text-center">{data.siswa.nis || '-'}</td>
                      <td className="text-center">{data.siswa.kelas?.nama_kelas || '-'}</td>
                      {BULAN_AJARAN.map(bulan => {
                        const tagihan = data.tagihan[bulan];
                        return (
                          <td key={bulan} className="text-center p-1">
                            {tagihan ? (
                              <div>
                                <small className="text-muted d-block" style={{ fontSize: '10px' }}>
                                  {formatRupiah(tagihan.nominal)}
                                </small>
                                <Badge 
                                  bg={tagihan.status === 'lunas' ? 'success' : tagihan.sisa < tagihan.nominal ? 'warning' : 'danger'}
                                  className="w-100"
                                  style={{ fontSize: '10px' }}
                                >
                                  {formatRupiah(tagihan.dibayar)}
                                </Badge>
                              </div>
                            ) : (
                              <Badge bg="secondary" className="w-100">-</Badge>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center fw-bold text-success">
                        {formatRupiah(data.totalDibayar)}
                      </td>
                      <td className="text-center">
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          onClick={() => handleViewDetail(data)}
                        >
                          <Eye size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={BULAN_AJARAN.length + 6} className="text-center text-muted py-4">
                      {selectedSemester ? "Tidak ada data tagihan" : "Pilih semester terlebih dahulu"}
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredData.length > 0 && (
                <tfoot className="table-light">
                  <tr>
                    <td colSpan="4" className="text-end fw-bold">TOTAL:</td>
                    {BULAN_AJARAN.map(bulan => {
                      const total = filteredData.reduce((sum, data) => {
                        const t = data.tagihan[bulan];
                        return sum + (t ? parseFloat(t.dibayar) : 0);
                      }, 0);
                      return (
                        <td key={bulan} className="text-center fw-bold">
                          {formatRupiah(total)}
                        </td>
                      );
                    })}
                    <td className="text-center fw-bold text-success">
                      {formatRupiah(stats.totalDibayar)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal Set Nominal - Same as before */}
      <Modal show={showSetNominalModal} onHide={() => setShowSetNominalModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Set Nominal Tagihan Tuition Fee</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSetNominal}>
          <Modal.Body>
            <Alert variant="info">
              <small>
                <strong>Info:</strong> Nominal yang diset akan berlaku untuk semua bulan dalam rentang yang dipilih.
              </small>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Pilih Siswa <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={nominalForm.siswa_id}
                onChange={(e) => setNominalForm({...nominalForm, siswa_id: e.target.value})}
                required
              >
                <option value="">-- Pilih Siswa --</option>
                {siswaList.map(siswa => (
                  <option key={siswa.id} value={siswa.id}>
                    {siswa.nama} - Kelas {siswa.kelas?.nama_kelas || 'Tanpa Kelas'}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Semester <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={nominalForm.semester_id}
                onChange={(e) => setNominalForm({...nominalForm, semester_id: e.target.value})}
                required
              >
                <option value="">-- Pilih Semester --</option>
                {semesterList.map(sem => (
                  <option key={sem.id} value={sem.id}>
                    {sem.nama} - {sem.tahun_ajaran}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nominal Per Bulan <span className="text-danger">*</span></Form.Label>
              <InputGroup>
                <InputGroup.Text>Rp</InputGroup.Text>
                <Form.Control
                  type="number"
                  placeholder="Contoh: 500000"
                  value={nominalForm.nominal_per_bulan}
                  onChange={(e) => setNominalForm({...nominalForm, nominal_per_bulan: e.target.value})}
                  required
                  min="0"
                />
              </InputGroup>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bulan Mulai <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={nominalForm.bulan_mulai}
                    onChange={(e) => setNominalForm({...nominalForm, bulan_mulai: e.target.value})}
                    required
                  >
                    {Object.entries(NAMA_BULAN).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bulan Selesai <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={nominalForm.bulan_selesai}
                    onChange={(e) => setNominalForm({...nominalForm, bulan_selesai: e.target.value})}
                    required
                  >
                    {Object.entries(NAMA_BULAN).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSetNominalModal(false)} disabled={processing}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={processing}>
              {processing ? 'Memproses...' : 'Set Nominal'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Detail - Same structure */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detail Tagihan Tuition Fee</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSiswa && (
            <>
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p className="mb-1"><strong>Nama:</strong> {selectedSiswa.siswa.nama}</p>
                      <p className="mb-1"><strong>NIS:</strong> {selectedSiswa.siswa.nis || '-'}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1"><strong>Kelas:</strong> {selectedSiswa.siswa.kelas?.nama || '-'}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Table bordered size="sm">
                <thead className="table-light">
                  <tr>
                    <th>Bulan</th>
                    <th className="text-end">Tagihan</th>
                    <th className="text-end">Dibayar</th>
                    <th className="text-end">Sisa</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {BULAN_AJARAN.map(bulan => {
                    const tagihan = selectedSiswa.tagihan[bulan];
                    return (
                      <tr key={bulan}>
                        <td>{NAMA_BULAN[bulan]}</td>
                        <td className="text-end">
                          {tagihan ? formatRupiah(tagihan.nominal) : '-'}
                        </td>
                        <td className="text-end">
                          {tagihan ? formatRupiah(tagihan.dibayar) : '-'}
                        </td>
                        <td className="text-end">
                          {tagihan ? formatRupiah(tagihan.sisa) : '-'}
                        </td>
                        <td className="text-center">
                          {tagihan ? (
                            <Badge bg={tagihan.status === 'lunas' ? 'success' : 'warning'}>
                              {tagihan.status === 'lunas' ? 'LUNAS' : 'BELUM LUNAS'}
                            </Badge>
                          ) : <Badge bg="secondary">-</Badge>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td className="fw-bold">TOTAL</td>
                    <td className="text-end fw-bold">{formatRupiah(selectedSiswa.totalTagihan)}</td>
                    <td className="text-end fw-bold text-success">{formatRupiah(selectedSiswa.totalDibayar)}</td>
                    <td className="text-end fw-bold text-danger">
                      {formatRupiah(selectedSiswa.totalTagihan - selectedSiswa.totalDibayar)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
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