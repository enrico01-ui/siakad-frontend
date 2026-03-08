import { useState, useEffect, useMemo} from "react";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 768);
  checkMobile(); // set nilai awal
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
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

  const filteredData = useMemo(() => {
  let filtered = pembayaranData;

  if (activeTab !== "semua") {
    filtered = filtered.filter(item => item.status === activeTab);
  }

  if (searchTerm) {
    const query = searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.siswa?.nama?.toLowerCase().includes(query) ||
      item.siswa?.nis?.toLowerCase().includes(query) ||  // ← tambah toLowerCase
      item.siswa?.kelas?.nama_kelas?.toLowerCase().includes(query)
    );
  }

  return filtered;
}, [pembayaranData, activeTab, searchTerm]);

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

  

  const stats = {
    pending: pembayaranData.filter(p => p.status === 'PENDING').length,
    diterima: pembayaranData.filter(p => p.status === 'DITERIMA').length,
    ditolak: pembayaranData.filter(p => p.status === 'DITOLAK').length,
    total: pembayaranData.length,
  };

  return (
    <Container fluid className="p-3 p-md-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div className="mb-3 mb-md-4">
        <div className="d-flex align-items-center mb-2">
          <CreditCard size={28} className="me-2 text-primary d-none d-md-block" />
          <CreditCard size={24} className="me-2 text-primary d-md-none" />
          <div className="flex-grow-1">
            <h3 className="fw-bold mb-0 d-none d-md-block">Verifikasi Pembayaran SPP</h3>
            <h5 className="fw-bold mb-0 d-md-none">Verifikasi Pembayaran</h5>
            <p className="text-muted mb-0 small">Kelola dan verifikasi pembayaran siswa</p>
          </div>
          <Button variant="outline-primary" onClick={loadPembayaran} size="sm">
            <Download size={16} className="d-md-none" />
            <span className="d-none d-md-inline">
              <Download size={18} className="me-2" />
              Refresh
            </span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-2 g-md-3 mb-3 mb-md-4">
  {[
    { label: 'Total', value: stats.total, color: 'primary', icon: <FileEarmarkText size={20} className="text-primary" /> },
    { label: 'Pending', value: stats.pending, color: 'warning', icon: <Clock size={20} className="text-warning" /> },
    { label: 'Diterima', value: stats.diterima, color: 'success', icon: <CheckCircle size={20} className="text-success" /> },
    { label: 'Ditolak', value: stats.ditolak, color: 'danger', icon: <XCircle size={20} className="text-danger" /> },
  ].map(({ label, value, color, icon }) => (
    <Col xs={6} md={3} key={label}>
      <Card className="border-0 shadow-sm h-100">
        <Card.Body className="p-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted mb-1 small">{label}</p>
              <h4 className={`mb-0 fw-bold text-${color}`}>{value}</h4>
            </div>
            <div className={`bg-${color} bg-opacity-10 p-2 rounded-3`}>
              {icon}
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  ))}
</Row>

      {/* Main Card */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-3">
          {/* Search */}
          <Row className="mb-3 g-2">
            <Col xs={12}>
             <InputGroup style={{ flexWrap: 'nowrap', minWidth: 0 }}>
              <InputGroup.Text style={{ flexShrink: 0 }}>
                <Search size={18} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Cari nama, NIS, kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ minWidth: 0, flex: '1 1 auto' }}
              />
            </InputGroup>
            </Col>
            {stats.pending > 0 && (
              <Col xs={12}>
                <Alert variant="warning" className="mb-0 py-2">
                  <small className="d-flex align-items-center">
                    <InfoCircle size={16} className="me-2 flex-shrink-0" />
                    <span>
                      <strong>{stats.pending}</strong> pembayaran menunggu verifikasi
                    </span>
                  </small>
                </Alert>
              </Col>
            )}
          </Row>

          {/* Tabs */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3 nav-fill"
          >
            <Tab 
              eventKey="semua" 
              title={
                <span className="d-flex align-items-center justify-content-center gap-1">
                  <FileEarmarkText size={14} />
                  <span className="d-none d-md-inline">Semua</span> ({stats.total})
                </span>
              } 
            />
            <Tab 
              eventKey="PENDING" 
              title={
                <span className="d-flex align-items-center justify-content-center gap-1">
                  <Clock size={14} />
                  <span className="d-none d-md-inline">Pending</span> ({stats.pending})
                </span>
              } 
            />
            <Tab 
              eventKey="DITERIMA" 
              title={
                <span className="d-flex align-items-center justify-content-center gap-1">
                  <CheckCircle size={14} />
                  <span className="d-none d-md-inline">Diterima</span> ({stats.diterima})
                </span>
              } 
            />
            <Tab 
              eventKey="DITOLAK" 
              title={
                <span className="d-flex align-items-center justify-content-center gap-1">
                  <XCircle size={14} />
                  <span className="d-none d-md-inline">Ditolak</span> ({stats.ditolak})
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
          ) : isMobile ? (
            /* Mobile Card View */
            <div>
              {filteredData.length > 0 ? (
                filteredData.map((payment) => (
                  <Card key={payment.id} className="mb-3 shadow-sm">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="flex-grow-1">
                          <h6 className="mb-1 fw-bold">{payment.siswa?.nama || '-'}</h6>
                          <small className="text-muted d-block">
                            NIS: {payment.siswa?.nis || '-'}
                          </small>
                          <Badge bg="secondary" className="mt-1">
                            {payment.siswa?.kelas?.nama_kelas || '-'}
                          </Badge>
                        </div>
                        <div style={{ minWidth: '90px' }}>
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>

                      <div className="border-top pt-2 mt-2">
                        <Row className="g-2 mb-2">
                          <Col xs={6}>
                            <small className="text-muted d-block">Tanggal</small>
                            <strong>
                              {new Date(payment.created_at).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </strong>
                          </Col>
                          <Col xs={6}>
                            <small className="text-muted d-block">Periode</small>
                            <strong>{getBulanNama(payment.bulan)} {payment.tahun}</strong>
                          </Col>
                        </Row>

                        <div className="mb-2">
                          <small className="text-muted d-block">Nominal</small>
                          <h5 className="mb-0 fw-bold text-success">{formatRupiah(payment.jumlah)}</h5>
                        </div>

                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="w-100 mt-2"
                          onClick={() => handleViewDetail(payment)}
                        >
                          <Eye size={14} className="me-1" />
                          Lihat Detail
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <Alert variant="secondary" className="text-center">
                  {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada data pembayaran'}
                </Alert>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
            </div>
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
        isMobile={isMobile}
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
  setShowImageModal,
  isMobile
}) {
  if (!payment) return null;

  const isPending = payment.status === 'PENDING';
  const tagihanItems = payment.tagihan?.map(t => ({
    tagihan_id: t.id,
    jenis_tagihan: t.jenis_tagihan,
    nominal: t.pivot.nominal_dibayar,
    bulan: t.bulan,
    tahun: t.tahun,
  })) || [];

  return (
    <>
      <Modal show={show} onHide={onHide} size={isMobile ? "lg" : "xl"}
        fullscreen={isMobile ? "md-down" : false} >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <CreditCard className="me-2" size={isMobile ? 20 : 24} />
            <span style={{ fontSize: isMobile ? '16px' : '20px' }}>
              Detail Pembayaran SPP
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            {/* Siswa Info Card */}
            <Col xs={12} md={6}>
              <Card className="h-100 border-0 bg-light">
                <Card.Body className={isMobile ? "p-3" : ""}>
                  <h6 className="fw-bold mb-3 d-flex align-items-center">
                    <Person size={18} className="me-2 text-primary" />
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
            <Col xs={12} md={6}>
              <Card className="h-100 border-0 bg-light">
                <Card.Body className={isMobile ? "p-3" : ""}>
                  <h6 className="fw-bold mb-3 d-flex align-items-center">
                    <FileEarmarkText size={18} className="me-2 text-primary" />
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
            <Col xs={12}>
              <Card className="border-0 bg-light">
                <Card.Body className={isMobile ? "p-3" : ""}>
                  <h6 className="fw-bold mb-3">Rincian Tagihan</h6>
                  
                  {payment.breakdown && (
                    <Alert variant="info" className="mb-3">
                      <strong>Breakdown:</strong><br />
                      {payment.breakdown}
                    </Alert>
                  )}
                  <div style={{ overflowX: 'auto' }}>
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
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Bukti Transfer */}
             <Col xs={12}>
              <Card className="border-0 bg-light">
                <Card.Body className={isMobile ? "p-3" : ""}>
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
              <Col xs={12}>
                <Card className="border-warning bg-warning bg-opacity-10">
                  <Card.Body className={isMobile ? "p-3" : ""}>
                    <h6 className="fw-bold mb-3 text-warning">
                      <Clock size={18} className="me-2" />
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
              <Col xs={12}>
                <Alert variant={payment.status === 'DITERIMA' ? 'success' : 'danger'}>
                  <div className="d-flex align-items-start">
                    {payment.status === 'DITERIMA' ? (
                      <CheckCircle size={24} className="me-2 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle size={24} className="me-2 mt-1 flex-shrink-0" />
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
          <div className={`d-flex gap-2 ${isMobile ? 'w-100 flex-column' : ''}`}>
            <Button 
              variant="secondary" 
              onClick={onHide} 
              disabled={processing}
              className={isMobile ? 'w-100' : ''}
            >
              Tutup
            </Button>
          {isPending && (
            <>
              <Button 
                variant="danger" 
                onClick={() => onReject(payment.id)}
                disabled={processing || !rejectReason.trim()}
                className={isMobile ? 'w-100' : ''}
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
                className={isMobile ? 'w-100' : ''}
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
          </div>
        </Modal.Footer>
      </Modal>

      {/* Image Modal (Full Size) */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)} 
        size="xl"
        centered
        fullscreen={isMobile ? true : false}
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