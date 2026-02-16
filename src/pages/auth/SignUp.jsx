import React from "react";

function InfoPanel() {
  return (
    <div className="form-container sign-up-container">
      <div
        style={{
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 50px",
          height: "100%",
          textAlign: "center"
        }}
      >
        <h1>Akses Akun</h1>

        <p style={{ marginTop: "20px", fontSize: "14px", lineHeight: "1.6" }}>
          Akun Sistem Informasi Akademik
          <br />
          <strong>dibuat dan dikelola oleh pihak sekolah.</strong>
        </p>

        <p style={{ fontSize: "13px", color: "#555" }}>
          Jika Anda mengalami kendala login,
          silakan hubungi bagian administrasi sekolah.
        </p>
      </div>
    </div>
  );
}

export default InfoPanel;
