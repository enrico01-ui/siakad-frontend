import { Container, Card, Table, Badge, Button } from "react-bootstrap";
import { Download } from "react-bootstrap-icons";

export default function StatusSPP() {
  const pembayaran = [
    { bulan: "Januari 2025", tanggal: "05/01/2025", jumlah: "Rp 500.000", status: "Lunas" },
    { bulan: "Februari 2025", tanggal: "-", jumlah: "Rp 500.000", status: "Belum Lunas" },
    { bulan: "Maret 2025", tanggal: "-", jumlah: "Rp 500.000", status: "Belum Lunas" },
  ];

  return (
    <Container fluid className="p-4">
      <h2 className="mb-4">Status Pembayaran SPP</h2>
      
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <h5>Informasi Pembayaran</h5>
          <p className="mb-1"><strong>Nama:</strong> Naufal Dhean</p>
          <p className="mb-1"><strong>Kelas:</strong> XII IPA 1</p>
          <p className="mb-1"><strong>SPP per Bulan:</strong> Rp 500.000</p>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <h5 className="mb-3">Riwayat Pembayaran</h5>
          <Table striped bordered hover responsive>
            <thead className="table-primary">
              <tr>
                <th>No</th>
                <th>Bulan</th>
                <th>Tanggal Bayar</th>
                <th>Jumlah</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pembayaran.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.bulan}</td>
                  <td>{item.tanggal}</td>
                  <td>{item.jumlah}</td>
                  <td>
                    <Badge bg={item.status === "Lunas" ? "success" : "warning"}>
                      {item.status}
                    </Badge>
                  </td>
                  <td>
                    {item.status === "Lunas" && (
                      <Button size="sm" variant="outline-primary">
                        <Download size={14} /> Bukti
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}