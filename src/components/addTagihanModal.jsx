import { useState, useMemo } from 'react';
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
function AddTagihanModal({ show, onHide, formData, setFormData, siswaList, semesterList, onSubmit, currentLabel, formatRupiah, namaBulan, loading }) {
  const [searchSiswa, setSearchSiswa] = useState('');
  const [showSiswaDropdown, setShowSiswaDropdown] = useState(false);
  const [filterKelas, setFilterKelas] = useState('all');
  const [sortBy, setSortBy] = useState('nama'); // nama, nis, kelas

  // ✅ Get unique kelas for filter
  const kelasList = useMemo(() => {
    const kelasSet = new Set();
    siswaList.forEach(siswa => {
      if (siswa.kelas?.nama_kelas) {
        kelasSet.add(JSON.stringify({
          id: siswa.kelas.id,
          nama: siswa.kelas.nama_kelas
        }));
      }
    });
    return Array.from(kelasSet).map(k => JSON.parse(k));
  }, [siswaList]);

  // ✅ Filter and sort siswa
  const filteredSiswa = useMemo(() => {
    let result = [...siswaList];

    // Filter by search
    if (searchSiswa) {
      const search = searchSiswa.toLowerCase();
      result = result.filter(siswa => 
        siswa.nis?.toLowerCase().includes(search) ||
        siswa.nama?.toLowerCase().includes(search) ||
        siswa.kelas?.nama_kelas?.toLowerCase().includes(search)
      );
    }

    // Filter by kelas
    if (filterKelas !== 'all') {
      result = result.filter(siswa => siswa.kelas?.id === parseInt(filterKelas));
    }

    // Sort
    result.sort((a, b) => {
      switch(sortBy) {
        case 'nis':
          return (a.nis || '').localeCompare(b.nis || '');
        case 'kelas':
          return (a.kelas?.nama_kelas || '').localeCompare(b.kelas?.nama_kelas || '');
        case 'nama':
        default:
          return (a.nama || '').localeCompare(b.nama || '');
      }
    });

    return result;
  }, [siswaList, searchSiswa, filterKelas, sortBy]);

  // ✅ Get selected siswa
  const selectedSiswa = siswaList.find(s => s.id === parseInt(formData.siswa_id));

  // ✅ Handle siswa selection
  const handleSelectSiswa = (siswa) => {
    setFormData({ ...formData, siswa_id: siswa.id });
    setSearchSiswa(`${siswa.nis == null ? 'N/A' : siswa.nis} - ${siswa.nama}`);
    setShowSiswaDropdown(false);
  };

  // ✅ Clear selection
  const handleClearSiswa = () => {
    setFormData({ ...formData, siswa_id: '' });
    setSearchSiswa('');
    setFilterKelas('all');
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Tambah Tagihan {currentLabel}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Row>
            {/* ✅ SEARCHABLE SISWA SELECT WITH FILTERS */}
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Siswa <span className="text-danger">*</span></Form.Label>
                
                <div style={{ position: 'relative' }}>
                  {/* Search Input */}
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Cari berdasarkan NIS, Nama, atau Kelas..."
                      value={searchSiswa}
                      onChange={(e) => {
                        setSearchSiswa(e.target.value);
                        setShowSiswaDropdown(true);
                      }}
                      onFocus={() => setShowSiswaDropdown(true)}
                      required={!formData.siswa_id}
                    />
                    {formData.siswa_id && (
                      <Button 
                        variant="outline-secondary" 
                        onClick={handleClearSiswa}
                        title="Clear"
                      >
                        ✕
                      </Button>
                    )}
                  </InputGroup>

                  {/* ✅ Dropdown with Filters */}
                  {showSiswaDropdown && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #dee2e6',
                        borderRadius: '0.375rem',
                        marginTop: '2px',
                        zIndex: 1050,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* Filter Bar */}
                      <div style={{ 
                        padding: '10px', 
                        borderBottom: '1px solid #dee2e6',
                        backgroundColor: '#f8f9fa'
                      }}>
                        <Row className="g-2">
                          <Col xs={6}>
                            <Form.Select 
                              size="sm"
                              value={filterKelas}
                              onChange={(e) => setFilterKelas(e.target.value)}
                            >
                              <option value="all">Semua Kelas</option>
                              {kelasList.map(kelas => (
                                <option key={kelas.id} value={kelas.id}>
                                  {kelas.nama}
                                </option>
                              ))}
                            </Form.Select>
                          </Col>
                          <Col xs={6}>
                            <Form.Select
                              size="sm"
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value)}
                            >
                              <option value="nama">Sort: Nama</option>
                              <option value="nis">Sort: NIS</option>
                              <option value="kelas">Sort: Kelas</option>
                            </Form.Select>
                          </Col>
                        </Row>
                      </div>

                      {/* Results Count */}
                      <div style={{
                        padding: '8px 15px',
                        fontSize: '12px',
                        color: '#6c757d',
                        backgroundColor: '#f8f9fa',
                        borderBottom: '1px solid #dee2e6'
                      }}>
                        {filteredSiswa.length} siswa ditemukan
                      </div>

                      {/* Results List */}
                      <div style={{
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}>
                        {filteredSiswa.length > 0 ? (
                          filteredSiswa.map(siswa => (
                            <div
                              key={siswa.id}
                              onClick={() => handleSelectSiswa(siswa)}
                              style={{
                                padding: '10px 15px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f0f0f0',
                                backgroundColor: formData.siswa_id === siswa.id ? '#e7f3ff' : 'white'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = formData.siswa_id === siswa.id ? '#e7f3ff' : 'white'}
                            >
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                    {siswa.nama}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                    NIS: {siswa.nis}
                                  </div>
                                </div>
                                <div>
                                  <span style={{
                                    padding: '3px 8px',
                                    backgroundColor: '#e7f3ff',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#0d6efd'
                                  }}>
                                    {siswa.kelas?.nama_kelas || '-'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '30px', textAlign: 'center', color: '#6c757d' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔍</div>
                            <div>Siswa tidak ditemukan</div>
                            <div style={{ fontSize: '12px', marginTop: '5px' }}>
                              Coba ubah filter atau kata kunci pencarian
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Form.Text className="text-muted">
                  💡 Tip: Gunakan filter kelas untuk mempercepat pencarian
                </Form.Text>
              </Form.Group>
            </Col>

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
                    <option key={sem.id} value={sem.id}>
                      {sem.nama} - {sem.tahun_ajaran}
                    </option>
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

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Bulan</Form.Label>
                <Form.Select
                  value={formData.bulan}
                  onChange={(e) => setFormData({ ...formData, bulan: e.target.value })}
                >
                  <option value="">Pilih bulan</option>
                  {namaBulan.map((bulan, index) => (
                    <option key={index+1} value={index + 1}>{bulan}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Tahun <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  value={formData.tahun}
                  onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
                  required
                  min="2020"
                  max="2030"
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
                  Kosongkan jika tidak ada batas waktu
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
                    min="0"
                  />
                </InputGroup>
                {formData.nominal_tagihan && (
                  <Form.Text className="text-muted">
                    {formatRupiah(formData.nominal_tagihan)}
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Batal</Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
                <>
                <Spinner size="sm" animation="border" className="me-2" />
                Menyimpan...
                </>
            ) : (
                "Simpan"
            )}
            </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default AddTagihanModal;