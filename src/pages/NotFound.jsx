import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ padding: 40 }}>
      <h1>404</h1>
      <p>Halaman tidak ditemukan</p>
      <Link to="/">Kembali ke Login</Link>
    </div>
  );
}
