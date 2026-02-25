import { useState, useEffect } from "react";
import { 
  Container, Row, Col, Card, Table, Badge, Button, 
  Modal, Form, InputGroup, Tabs, Tab, Alert, Spinner, Image 
} from "react-bootstrap";
import { 
  Search, Eye, CheckCircle, XCircle, Download, 
  Calendar, CashStack, FileEarmarkText, Clock,
  Person, CreditCard, InfoCircle
} from "react-bootstrap-icons";
import { 
  getSpp, 
  getSppDetail, 
  verifySpp, 
  rejectSpp 
} from "../../services/sppApi";

export default function VerifikasiPembayaran() {
  const [loading, setLoading] = useState(true);
  const [pembayaranData, setPembayaranData] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING");
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    loadPembayaran();
  }, []);

  const loadPembayaran = async () => {
    try {
      setLoading(true);
      const response = await getSpp();
      setPembayaranData(response.data.data || []);
    } catch (error) {
      console.error("Error loading pembayaran:", error);
      alert("Gagal memuat data pembayaran!");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (payment) => {
    try {
      setLoading(true);
      const response = await getSppDetail(payment.id);
      setSelectedPayment(response.data);
      setRejectReason("");
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error loading detail:", error);
      alert("Gagal memuat detail pembayaran!");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menyetujui pembayaran ini?")) return;

    try {
      setProcessing(true);
      await verifySpp(id);
      alert("✅ Pembayaran berhasil diverifikasi!\nNotifikasi telah dikirim ke siswa.");
      setShowDetailModal(false);
      await loadPembayaran();
    } catch (error) {
      console.error("Error approving payment:", error);
      alert("❌ Gagal menyetujui pembayaran!");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      alert("⚠️ Alasan penolakan harus diisi!");
      return;
    }

    if (!window.confirm("Apakah Anda yakin ingin menolak pembayaran ini?")) return;

    try {
      setProcessing(true);
      console.log('📤 Sending reject request:', {
        id,
        catatan: rejectReason.trim()
      });
      const response = await rejectSpp(id, rejectReason.trim());
      console.log('✅ Reject response:', response);
      if (response.data && response.data.success) {
        alert("✅ Pembayaran berhasil ditolak!\nNotifikasi telah dikirim ke siswa.");
        setShowDetailModal(false);
        setRejectReason(""); // Clear reason
        await loadPembayaran();
      } else {
        // Handle unsuccessful response
        const errorMessage = response.data?.message || 'Gagal menolak pembayaran';
        alert(`❌ ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error rejecting payment:", error);
      alert("❌ Gagal menolak pembayaran!");
    } finally {
      setProcessing(false);
    }
  };

  const getFilteredData = () => {
    let filtered = pembayaranData;

    // Filter by tab (status)
    if (activeTab !== "semua") {
      filtered = filtered.filter(item => item.status === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.siswa?.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.siswa?.nis?.includes(searchTerm) ||
        item.siswa?.kelas?.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  const getBulanNama = (bulan) => {
    const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return namaBulan[parseInt(bulan) - 1] || bulan;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': <Badge bg="warning" className="align-items-center gap-1"><Clock size={12} /> Menunggu</Badge>,
      'DITERIMA': <Badge bg="success" className="align-items-center gap-1"><CheckCircle size={12} /> Diterima</Badge>,
      'DITOLAK': <Badge bg="danger" className="align-items-center gap-1"><XCircle size={12} /> Ditolak</Badge>
    };
    return badges[status] || <Badge bg="secondary">{status}</Badge>;
  };

  const filteredData = getFilteredData();

  const stats = {
    pending: pembayaranData.filter(p => p.status === 'PENDING').length,
    diterima: pembayaranData.filter(p => p.status === 'DITERIMA').length,
    ditolak: pembayaranData.filter(p => p.status === 'DITOLAK').length,
    total: pembayaranData.length,
  };

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <CreditCard size={32} className="me-2 text-primary" />
            Verifikasi Pembayaran SPP
          </h2>
          <p className="text-muted mb-0">Kelola dan verifikasi pembayaran siswa</p>
        </div>
        <Button variant="outline-primary" onClick={loadPembayaran}>
          <Download size={18} className="me-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Total Pembayaran</p>
                  <h3 className="mb-0 fw-bold text-primary">{stats.total}</h3>
                  <small className="text-muted">Semua status</small>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                  <FileEarmarkText size={28} className="text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Menunggu Verifikasi</p>
                  <h3 className="mb-0 fw-bold text-warning">{stats.pending}</h3>
                  <small className="text-muted">Perlu ditinjau</small>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded-3">
                  <Clock size={28} className="text-warning" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Diterima</p>
                  <h3 className="mb-0 fw-bold text-success">{stats.diterima}</h3>
                  <small className="text-muted">Terverifikasi</small>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-3">
                  <CheckCircle size={28} className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3} md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Ditolak</p>
                  <h3 className="mb-0 fw-bold text-danger">{stats.ditolak}</h3>
                  <small className="text-muted">Tidak valid</small>
                </div>
                <div className="bg-danger bg-opacity-10 p-3 rounded-3">
                  <XCircle size={28} className="text-danger" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Card */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {/* Search */}
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Cari nama siswa, NIS, atau kelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              {stats.pending > 0 && (
                <Alert variant="warning" className="mb-0 py-2 d-inline-flex align-items-center">
                  <InfoCircle size={18} className="me-2" />
                  <strong>{stats.pending}</strong>&nbsp;pembayaran menunggu verifikasi
                </Alert>
              )}
            </Col>
          </Row>

          {/* Tabs */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab 
              eventKey="semua" 
              title={
                <span>
                  <FileEarmarkText size={16} className="me-1" />
                  Semua ({stats.total})
                </span>
              } 
            />
            <Tab 
              eventKey="PENDING" 
              title={
                <span>
                  <Clock size={16} className="me-1" />
                  Menunggu ({stats.pending})
                </span>
              } 
            />
            <Tab 
              eventKey="DITERIMA" 
              title={
                <span>
                  <CheckCircle size={16} className="me-1" />
                  Diterima ({stats.diterima})
                </span>
              } 
            />
            <Tab 
              eventKey="DITOLAK" 
              title={
                <span>
                  <XCircle size={16} className="me-1" />
                  Ditolak ({stats.ditolak})
                </span>
              } 
            />
          </Tabs>

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
                  <th style={{ width: '5%' }}>No</th>
                  <th style={{ width: '10%' }}>Tanggal</th>
                  <th style={{ width: '10%' }}>NIS</th>
                  <th style={{ width: '20%' }}>Nama Siswa</th>
                  <th style={{ width: '10%' }}>Kelas</th>
                  <th style={{ width: '12%' }}>Periode</th>
                  <th style={{ width: '13%' }}>Nominal</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '10%' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((payment, index) => (
                    <tr key={payment.id}>
                      <td>{index + 1}</td>
                      <td>
                        <small>
                          {new Date(payment.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </small>
                      </td>
                      <td>{payment.siswa?.nis || '-'}</td>
                      <td className="fw-medium">{payment.siswa?.nama || '-'}</td>
                      <td>
                        <Badge bg="secondary" className="text-white">
                          {payment.siswa?.kelas?.nama_kelas || '-'}
                        </Badge>
                      </td>
                      <td>
                        {getBulanNama(payment.bulan)} {payment.tahun}
                      </td>
                      <td className="fw-bold text-success">{formatRupiah(payment.jumlah)}</td>
                      <td>{getStatusBadge(payment.status)}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleViewDetail(payment)}
                        >
                          <Eye size={14} className="me-1" />
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada data pembayaran'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Detail Modal */}
      <DetailPembayaranModal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        payment={selectedPayment}
        onApprove={handleApprove}
        onReject={handleReject}
        processing={processing}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        formatRupiah={formatRupiah}
        getBulanNama={getBulanNama}
        getStatusBadge={getStatusBadge}
        showImageModal={showImageModal}
        setShowImageModal={setShowImageModal}
      />
    </Container>
  );
}

// Detail Modal Component
function DetailPembayaranModal({
  show,
  onHide,
  payment,
  onApprove,
  onReject,
  processing,
  rejectReason,
  setRejectReason,
  formatRupiah,
  getBulanNama,
  getStatusBadge,
  showImageModal,
  setShowImageModal
}) {
  if (!payment) return null;

  const isPending = payment.status === 'PENDING';
  const tagihanItems = payment.tagihan_items_array || [];

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <CreditCard className="me-2" />
            Detail Pembayaran SPP
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            {/* Siswa Info Card */}
            <Col md={6} className="mb-3">
              <Card className="h-100 border-0 bg-light">
                <Card.Body>
                  <h6 className="fw-bold mb-3 d-flex align-items-center">
                    <Person size={20} className="me-2 text-primary" />
                    Informasi Siswa
                  </h6>
                  <Table borderless size="sm" className="mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{width: '35%'}}>NIS</td>
                        <td className="fw-medium">: {payment.siswa?.nis || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Nama</td>
                        <td className="fw-medium">: {payment.siswa?.nama || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Kelas</td>
                        <td>
                          : <Badge bg="secondary">{payment.siswa?.kelas?.nama_kelas || '-'}</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* Payment Info Card */}
            <Col md={6} className="mb-3">
              <Card className="h-100 border-0 bg-light">
                <Card.Body>
                  <h6 className="fw-bold mb-3 d-flex align-items-center">
                    <FileEarmarkText size={20} className="me-2 text-primary" />
                    Informasi Pembayaran
                  </h6>
                  <Table borderless size="sm" className="mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{width: '35%'}}>ID</td>
                        <td className="fw-medium">: #{payment.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Tanggal Upload</td>
                        <td className="fw-medium">: {new Date(payment.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Periode</td>
                        <td className="fw-medium">: {getBulanNama(payment.bulan)} {payment.tahun}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Total Nominal</td>
                        <td className="fw-bold text-success fs-5">: {formatRupiah(payment.jumlah)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Status</td>
                        <td>: {getStatusBadge(payment.status)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* Breakdown Tagihan */}
            <Col md={12} className="mb-3">
              <Card className="border-0 bg-light">
                <Card.Body>
                  <h6 className="fw-bold mb-3">Rincian Tagihan yang Dibayar</h6>
                  
                  {payment.breakdown && (
                    <Alert variant="info" className="mb-3">
                      <strong>Breakdown:</strong><br />
                      {payment.breakdown}
                    </Alert>
                  )}

                  <Table bordered hover size="sm" className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '5%' }}>No</th>
                        <th style={{ width: '35%' }}>Jenis Tagihan</th>
                        <th style={{ width: '35%' }}>Nominal Dibayar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tagihanItems.length > 0 ? (
                        tagihanItems.map((item, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>Tagihan {item.jenis_tagihan}</td>
                            <td className="fw-bold">{formatRupiah(item.nominal)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-muted">Tidak ada detail tagihan</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="table-secondary">
                      <tr>
                        <td colSpan="2" className="text-end fw-bold">Total:</td>
                        <td className="fw-bold text-success fs-6">{formatRupiah(payment.jumlah)}</td>
                      </tr>
                    </tfoot>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            {/* Bukti Transfer */}
            <Col md={12} className="mb-3">
              <Card className="border-0 bg-light">
                <Card.Body>
                  <h6 className="fw-bold mb-3">Bukti Transfer</h6>
                  <div className="text-center position-relative">
                    {payment.bukti_transfer ? (
                      <>
                        <Image 
                          src={`${import.meta.env.VITE_API_URL}/storage/${payment.bukti_transfer}`}
                          alt="Bukti Transfer"
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '500px', 
                            objectFit: 'contain',
                            cursor: 'pointer',
                            border: '2px solid #dee2e6',
                            borderRadius: '8px',
                            padding: '8px',
                            backgroundColor: 'white'
                          }}
                          onClick={() => setShowImageModal(true)}
                          thumbnail
                        />
                        {console.log('vite api url:', import.meta.env.VITE_API_URL)}
                        <div className="mt-2">
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => setShowImageModal(true)}
                          >
                            <Eye size={16} className="me-1" />
                            Lihat Ukuran Penuh
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Alert variant="warning">
                        <InfoCircle size={18} className="me-2" />
                        Bukti transfer tidak tersedia
                      </Alert>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Verifikasi Section - Only show if PENDING */}
            {isPending && (
              <Col md={12}>
                <Card className="border-warning bg-warning bg-opacity-10">
                  <Card.Body>
                    <h6 className="fw-bold mb-3 text-warning">
                      <Clock size={20} className="me-2" />
                      Verifikasi Pembayaran
                    </h6>
                    
                    <Alert variant="info">
                      <InfoCircle size={18} className="me-2" />
                      Periksa bukti transfer dengan teliti sebelum memverifikasi. Notifikasi akan dikirim ke siswa setelah verifikasi.
                    </Alert>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Alasan Penolakan <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Contoh: Bukti transfer tidak jelas, Nominal tidak sesuai, dll."
                      />
                      <Form.Text className="text-muted">
                        Wajib diisi jika ingin menolak pembayaran. Alasan akan dikirim ke siswa via notifikasi.
                      </Form.Text>
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
            )}

            {/* Verifikasi Info - Show if already verified */}
            {!isPending && payment.tanggal_verifikasi && (
              <Col md={12}>
                <Alert variant={payment.status === 'DITERIMA' ? 'success' : 'danger'}>
                  <div className="d-flex align-items-start">
                    {payment.status === 'DITERIMA' ? (
                      <CheckCircle size={24} className="me-2 mt-1" />
                    ) : (
                      <XCircle size={24} className="me-2 mt-1" />
                    )}
                    <div className="flex-grow-1">
                      <strong className="d-block mb-2">
                        {payment.status === 'DITERIMA' ? '✅ Pembayaran Diterima' : '❌ Pembayaran Ditolak'}
                      </strong>
                      <div className="small">
                        <div><strong>Diverifikasi oleh:</strong> {payment.verifier?.name || '-'}</div>
                        <div><strong>Waktu:</strong> {new Date(payment.tanggal_verifikasi).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</div>
                        {payment.catatan && (
                          <div className="mt-2">
                            <strong>Catatan:</strong> {payment.catatan}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Alert>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={onHide} disabled={processing}>
            Tutup
          </Button>
          {isPending && (
            <>
              <Button 
                variant="danger" 
                onClick={() => onReject(payment.id)}
                disabled={processing || !rejectReason.trim()}
              >
                {processing ? (
                  <Spinner animation="border" size="sm" className="me-2" />
                ) : (
                  <XCircle size={18} className="me-2" />
                )}
                Tolak Pembayaran
              </Button>
              <Button 
                variant="success" 
                onClick={() => onApprove(payment.id)}
                disabled={processing}
              >
                {processing ? (
                  <Spinner animation="border" size="sm" className="me-2" />
                ) : (
                  <CheckCircle size={18} className="me-2" />
                )}
                Terima Pembayaran
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* Image Modal (Full Size) */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)} 
        size="xl"
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Bukti Transfer (Ukuran Penuh)</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0">
          {payment?.bukti_transfer && (
            <Image 
              src={`${import.meta.env.VITE_API_URL}/storage/${payment.bukti_transfer}`}
              alt="Bukti Transfer"
              style={{ 
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}