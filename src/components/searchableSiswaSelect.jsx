import React, { useState, useMemo } from 'react';
import { Form, InputGroup, Button, Row, Col, Badge } from 'react-bootstrap';


function SearchableSiswaSelect({ siswaList, value, onChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filterKelas, setFilterKelas] = useState('all');
  const [sortBy, setSortBy] = useState('nama');

  // Get unique kelas
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

  // Filter and sort siswa
  const filteredSiswa = useMemo(() => {
    let result = [...siswaList];

    // Filter by search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
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
  }, [siswaList, searchTerm, filterKelas, sortBy]);

  // Get selected siswa
  const selectedSiswa = siswaList.find(s => s.id === parseInt(value));

  // Handle selection
  const handleSelect = (siswa) => {
    onChange(siswa.id);
    setSearchTerm(`${siswa.nis} - ${siswa.nama}`);
    setShowDropdown(false);
  };

  // Clear selection
  const handleClear = () => {
    onChange('');
    setSearchTerm('');
    setFilterKelas('all');
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>Pilih Siswa <span className="text-danger">*</span></Form.Label>
      
      <div style={{ position: 'relative' }}>
        {/* Search Input */}
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Cari berdasarkan NIS, Nama, atau Kelas..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            required={!value}
          />
          {value && (
            <Button 
              variant="outline-secondary" 
              onClick={handleClear}
              title="Clear"
            >
              ✕
            </Button>
          )}
        </InputGroup>

        {/* Dropdown with Filters */}
        {showDropdown && (
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
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              maxHeight: '400px',
              overflow: 'hidden'
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
                    onClick={() => handleSelect(siswa)}
                    style={{
                      padding: '10px 15px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: value === siswa.id ? '#e7f3ff' : 'white'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = value === siswa.id ? '#e7f3ff' : 'white'}
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
  );
}

export default SearchableSiswaSelect;