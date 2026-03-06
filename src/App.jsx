import React, { useState, useEffect } from "react";
import "./styles.css";
import SignInForm from "./pages/auth/SignIn";
import InfoPanel from "./pages/auth/SignUp";
import './AdminResponsive.css';

export default function App() {
  const [type, setType] = useState("signIn");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleOnClick = (text) => {
    if (text !== type) {
      setType(text);
      return;
    }
  };

  const containerClass =
    "container " + (type === "signUp" ? "right-panel-active" : "");

  return (
    <div className="login-page">
      <img
        src="https://hagiosschooloflife.sch.id/img/navbar/logo-hsol.webp"
        alt="Logo"
        style={{
          width: "120px",
          marginBottom: "20px",
          justifyContent: "center",
        }}
      />

      {/* Mobile Toggle Buttons */}
      {isMobile && (
        <div className="mobile-toggle">
          <button
            className={type === "signIn" ? "active" : ""}
            onClick={() => handleOnClick("signIn")}
          >
            Login
          </button>
          <button
            className={type === "signUp" ? "active" : ""}
            onClick={() => handleOnClick("signUp")}
          >
            Info
          </button>
        </div>
      )}

      <div className={containerClass} id="container" style={{ marginBottom: "5%" }}>
        <SignInForm />
        <InfoPanel />

        {/* Desktop Overlay - Hidden on Mobile */}
        {!isMobile && (
          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1>Welcome Back!</h1>
                <p>
                  To keep connected with us please login with your personal info
                </p>
                <button
                  className="ghost"
                  id="signIn"
                  onClick={() => handleOnClick("signIn")}
                >
                  Sign In
                </button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1>Selamat Datang</h1>
                <p>
                  Akses Sistem Informasi Akademik
                  <br />
                  Hagios School of Life
                </p>

                <button
                  className="ghost"
                  id="signUp"
                  onClick={() => handleOnClick("signUp")}
                >
                  Info
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}