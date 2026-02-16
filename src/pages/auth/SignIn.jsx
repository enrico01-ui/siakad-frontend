import React from "react";
import { Link } from "react-router-dom";
import { login } from "../../services/authApi";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";




function SignInForm() {
  const navigate = useNavigate();
  const [captchaToken, setCaptchaToken] = React.useState(null);
  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const [state, setState] = React.useState({
    username: "",
    password: ""
  });
  const handleChange = evt => {
    const value = evt.target.value;
    setState({
      ...state,
      [evt.target.name]: value
    });
  };

  const handleOnSubmit = async (evt) => {
    evt.preventDefault();

    if (!captchaToken) {
      toast.error("Silakan verifikasi captcha terlebih dahulu");
      return;
    }
    if(!state.username || !state.password){
      toast.error("Username dan password wajib diisi");
      return;
    }
    try {
      const { username, password } = state;

      const res = await login({ username, password });
      console.log(res);
      if(res.data.message === "Login gagal") {
        throw new Error(res.data.message || "Login gagal");
      }
      // simpan token & user
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Login berhasil");
      const role = res.data.user.role?.nama;
      console.log(role);
      // redirect sesuai role
      setTimeout(() => {
        if (role === "admin") {
          navigate("/admin");
        } else if (role === "guru" || role === "wali_kelas") {
          navigate("/guru");
        } else if (role === "siswa") {
          navigate("/siswa");
        } else {
          navigate("/");
        }
      }, 800);

      setState({ username: "", password: "" });

    } catch (err) {
      toast.error(err?.message || "Login gagal");
    }
  };

  return (
    <div className="form-container sign-in-container">
        
      <div>
        <div style={{ textAlign: "left", display: "flex", gap: "10px", alignItems: "center", marginBottom: "13%" }}>
        <img
            src="https://hagiosschooloflife.sch.id/img/navbar/logo-hsol.webp"
            alt="Hagios School of Life"
            style={{ width: "80px", marginBottom: "10px", marginLeft: "4%", marginTop: "10px" }}
        />
        <div>
            <strong style={{ margin: 0, color: "grey" }}>Sistem Informasi Akademik</strong>
        <p style={{ margin: 0, fontSize: "14px", color: "grey" }}>
            Hagios School of Life
        </p>
        </div>
        </div>
  
      <form onSubmit={handleOnSubmit}>
        <h1>Sign in</h1>
        
        <span>use your account</span>
        <input
          type="username"
          placeholder="username"
          name="username"
          value={state.username}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={state.password}
          onChange={handleChange}
        />
        <ReCAPTCHA
          sitekey="6Ld-k1UsAAAAAKCArmenvco0o_ffmhxAJJClItAd"
          onChange={handleCaptchaChange}
        />

        <button style={{marginTop: "4%"}}>Sign In</button>
      </form>
      </div>
    </div>
  );
}

export default SignInForm;
