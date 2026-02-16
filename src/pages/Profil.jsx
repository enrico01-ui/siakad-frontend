import { Container, Row, Col, Card, Form, Button, Tab, Tabs, Table, Badge } from "react-bootstrap";
import { PersonCircle, Pencil, Camera, Save, X } from "react-bootstrap-icons";
import { useState } from "react";

export default function Profil({ role }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(getInitialData(role));
  const user = JSON.parse(localStorage.getItem("user"));
  const guru = user ? user.guru : null;

  function getInitialData(role) {
    const user = JSON.parse(localStorage.getItem("user"));
  const guru = user ? user.guru : null;
    switch(role) {
      case 'admin':
        return guru;
      case 'guru':
        return guru;
      case 'wali_kelas':
        return guru;
      default: // siswa
        return {
          nama: "Naufal Dhean Pradana",
          email: "naufal.dhean@student.hagios.sch.id",
          telepon: "081234567892",
          alamat: "Jl. Siswa No. 78, Jakarta Timur",
          tanggalLahir: "2007-01-15",
          jenisKelamin: "Laki-laki",
          nis: "2024001",
          nisn: "0078654321",
          kelas: "XII IPA 1",
          jurusan: "IPA",
          tahunMasuk: "2022",
          namaOrangTua: "Bapak Dhean",
          pekerjaanOrangTua: "Wiraswasta",
          teleponOrangTua: "081234567893"
        };
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    console.log("Saving data:", formData);
    setIsEditing(false);
    alert("Profil berhasil diperbarui!");
  };

  const handleCancel = () => {
    setFormData(getInitialData(role));
    setIsEditing(false);
  };

  // Render berdasarkan role
  const renderProfilContent = () => {
    if (role === 'admin') {
      return <ProfilAdmin guru={formData} isEditing={isEditing} handleInputChange={handleInputChange} />;
    } else if (role === 'guru' || role === 'wali_kelas') {
      return <ProfilGuru guru={formData} isEditing={isEditing} handleInputChange={handleInputChange} />;
    } else {
      return <ProfilSiswa formData={formData} isEditing={isEditing} handleInputChange={handleInputChange} />;
    }
  };

  return (
    <Container fluid className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Profil {role === 'admin' ? 'Administrator' : role === 'guru' ? 'Guru' : 'Siswa'}</h2>
        {!isEditing ? (
          <Button variant="primary" onClick={() => setIsEditing(true)}>
            <Pencil size={16} className="me-2" />
            Edit Profil
          </Button>
        ) : (
          <div className="d-flex gap-2">
            <Button variant="success" onClick={handleSave}>
              <Save size={16} className="me-2" />
              Simpan
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              <X size={16} className="me-2" />
              Batal
            </Button>
          </div>
        )}
      </div>

      <Row>
        {/* Profile Picture & Quick Info */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="text-center">
              <div className="position-relative d-inline-block mb-3">
                <PersonCircle size={150} className="text-primary" />
                {isEditing && (
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="position-absolute bottom-0 end-0 rounded-circle"
                    style={{ width: "40px", height: "40px" }}
                  >
                    <Camera size={18} />
                  </Button>
                )}
              </div>
              <h5 className="fw-bold mb-1">{role === 'guru' || role === 'wali_kelas' ? user.guru.nama : role === 'admin' ? user.guru.nama : user.siswa.nama}</h5>
              <p className="text-muted mb-3">
                {role === 'admin' ? 'Admin' : role === 'guru' || role === 'wali_kelas' ? `Guru` : formData.kelas}
              </p>
              <div className="d-flex justify-content-center gap-2">
                <Badge bg="primary">
                  {role === 'admin' ? `NIP: 0${formData.nip}` : role === 'guru' || role === 'wali_kelas' ? `NIP: 0${formData.nip}` : `NIS: ${formData.nis}`}
                </Badge>
              </div>
            </Card.Body>
          </Card>

          {/* Quick Stats - khusus guru dan siswa */}
          {role === 'guru' || role === 'wali_kelas' && (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="fw-bold mb-3">Informasi Kepegawaian</h6>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Peran</span>
                  <Badge bg="success">{guru.peran}</Badge>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Mengajar Sejak</span>
                  <strong>{guru.tahun_masuk}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Pendidikan</span>
                  <strong>{guru.pendidikan_terakhir}</strong>
                </div>
              </Card.Body>
            </Card>
          )}

          {role === 'siswa' && (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h6 className="fw-bold mb-3">Informasi Akademik</h6>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">NISN</span>
                  <strong>{formData.nisn}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Jurusan</span>
                  <Badge bg="primary">{formData.jurusan}</Badge>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Tahun Masuk</span>
                  <strong>{formData.tahunMasuk}</strong>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Detailed Information */}
        <Col lg={8}>
          {renderProfilContent()}
        </Col>
      </Row>
    </Container>
  );
}

// Component untuk Profil Admin
function ProfilAdmin({ guru, isEditing, handleInputChange }) {
  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <Tabs defaultActiveKey="personal" className="mb-4">
          <Tab eventKey="personal" title="Informasi Pribadi">
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nama Lengkap</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="nama"
                      value={guru.nama}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>NIP</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="nip"
                      value={guru.nip}
                      disabled
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>No. Telepon</Form.Label>
                    <Form.Control 
                      type="tel" 
                      name="telepon"
                      value={guru.no_hp}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tanggal Lahir</Form.Label>
                    <Form.Control 
                      type="date" 
                      name="tanggalLahir"
                      value={guru.tgl_lahir}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
                
                
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Peran</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="peran"
                      value={guru.peran}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Tab>
          <Tab eventKey="security" title="Keamanan">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Password Lama</Form.Label>
                <Form.Control type="password" placeholder="Masukkan password lama" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password Baru</Form.Label>
                <Form.Control type="password" placeholder="Masukkan password baru" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Konfirmasi Password Baru</Form.Label>
                <Form.Control type="password" placeholder="Konfirmasi password baru" />
              </Form.Group>
              <Button variant="primary">Ubah Password</Button>
            </Form>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}

// Component untuk Profil Guru
function ProfilGuru({ guru, isEditing, handleInputChange }) {
  const kelasAmpu = [
    { kelas: "XII IPA 1", matpel: "Matematika", jumlahSiswa: 32 },
    { kelas: "XII IPA 2", matpel: "Matematika", jumlahSiswa: 30 },
    { kelas: "XI IPA 1", matpel: "Matematika", jumlahSiswa: 33 }
  ];

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <Tabs defaultActiveKey="personal" className="mb-4">
          <Tab eventKey="personal" title="Informasi Pribadi">
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nama Lengkap</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="nama"
                      value={guru.nama}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>NIP</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="nip"
                      value={0 + guru.nip}
                      disabled
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>No. Telepon</Form.Label>
                    <Form.Control 
                      type="tel" 
                      name="telepon"
                      value={guru.no_hp}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tanggal Lahir</Form.Label>
                    <Form.Control 
                      type="date" 
                      name="tanggalLahir"
                      value={guru.tgl_lahir}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
                

              </Row>
            </Form>
          </Tab>
          <Tab eventKey="academic" title="Informasi Akademik">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pendidikan Terakhir</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="pendidikan"
                    value={guru.pendidikan_terakhir}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Peran</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="peran"
                      value={guru.peran}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tahun Mulai Mengajar</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="tahunMengajar"
                    value={guru.tahun_masuk}
                    disabled
                  />
                </Form.Group>
              </Col>
            </Row>

            
          </Tab>
          <Tab eventKey="security" title="Keamanan">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Password Lama</Form.Label>
                <Form.Control type="password" placeholder="Masukkan password lama" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password Baru</Form.Label>
                <Form.Control type="password" placeholder="Masukkan password baru" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Konfirmasi Password Baru</Form.Label>
                <Form.Control type="password" placeholder="Konfirmasi password baru" />
              </Form.Group>
              <Button variant="primary">Ubah Password</Button>
            </Form>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}

// Component untuk Profil Siswa
function ProfilSiswa({ formData, isEditing, handleInputChange }) {
  const riwayatPrestasi = [
    { prestasi: "Juara 1 Olimpiade Matematika Tingkat Provinsi", tahun: "2024" },
    { prestasi: "Juara 2 Lomba Karya Ilmiah Remaja", tahun: "2023" },
    { prestasi: "Peserta OSN Matematika Nasional", tahun: "2023" }
  ];

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <Tabs defaultActiveKey="personal" className="mb-4">
          <Tab eventKey="personal" title="Informasi Pribadi">
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nama Lengkap</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="nama"
                      value={formData.nama}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>NIS</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="nis"
                      value={formData.nis}
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>NISN</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="nisn"
                      value={formData.nisn}
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>No. Telepon</Form.Label>
                    <Form.Control 
                      type="tel" 
                      name="telepon"
                      value={formData.telepon}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tanggal Lahir</Form.Label>
                    <Form.Control 
                      type="date" 
                      name="tanggalLahir"
                      value={formData.tanggalLahir}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Jenis Kelamin</Form.Label>
                    <Form.Select 
                      name="jenisKelamin"
                      value={formData.jenisKelamin}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    >
                      <option>Laki-laki</option>
                      <option>Perempuan</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Alamat</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3}
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Tab>
          <Tab eventKey="academic" title="Informasi Akademik">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kelas</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="kelas"
                    value={formData.kelas}
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Jurusan</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="jurusan"
                    value={formData.jurusan}
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tahun Masuk</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="tahunMasuk"
                    value={formData.tahunMasuk}
                    disabled
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="fw-bold mt-4 mb-3">Riwayat Prestasi</h6>
            <Table hover responsive>
              <thead className="table-light">
                <tr>
                  <th>No</th>
                  <th>Prestasi</th>
                  <th>Tahun</th>
                </tr>
              </thead>
              <tbody>
                {riwayatPrestasi.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.prestasi}</td>
                    <td><Badge bg="success">{item.tahun}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab>
          <Tab eventKey="parent" title="Data Orang Tua">
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nama Orang Tua/Wali</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="namaOrangTua"
                      value={formData.namaOrangTua}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pekerjaan</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="pekerjaanOrangTua"
                      value={formData.pekerjaanOrangTua}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>No. Telepon Orang Tua</Form.Label>
                    <Form.Control 
                      type="tel" 
                      name="teleponOrangTua"
                      value={formData.teleponOrangTua}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Tab>
          <Tab eventKey="security" title="Keamanan">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Password Lama</Form.Label>
                <Form.Control type="password" placeholder="Masukkan password lama" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password Baru</Form.Label>
                <Form.Control type="password" placeholder="Masukkan password baru" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Konfirmasi Password Baru</Form.Label>
                <Form.Control type="password" placeholder="Konfirmasi password baru" />
              </Form.Group>
              <Button variant="primary">Ubah Password</Button>
            </Form>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}