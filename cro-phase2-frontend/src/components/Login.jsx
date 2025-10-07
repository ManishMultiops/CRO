import React, { useState } from "react";
import { Link } from "react-router-dom";

import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/api";

const LoginComponent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    try {
      const response = await loginUser({ email, password });

      if (response.status === 200) {
        setSuccess("✅ Login successful!");
        setError("");
        // Optionally reset form fields
        setEmail("");
        setPassword("");
        console.log("LOGIN DATA", response.data);
        // Store tokens and user_id in localStorage
        localStorage.setItem("accessToken", response.data.access);
        localStorage.setItem("refreshToken", response.data.refresh);
        localStorage.setItem("user_id", response.data.user.id);
        // Redirect to some dashboard or home page
        navigate("/initalchat"); // change as appropriate
      } else {
        setError("Login failed. Please check your credentials.");
        setSuccess("");
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(message);
      setSuccess("");
    }
  };

  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

  return (
    <div style={{
      backgroundImage: "url('/assets/loginmain.jpg')",
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '16px' : '20px',
      
    }}>
      {/* Flex container for left and right sections */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          maxWidth: "1400px",
        }}
      >
        {/* Left: Login Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: isMobile ? '24px' : '40px',
          width: isMobile ? '100%' : '494px',
          height: isMobile ? 'auto' : '690px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          marginRight: isMobile ? '0' : '40px'
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              borderRadius: '15px',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: "url('/assets/loginlogo.png')",
              width: '90px',
              height: '90px',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}></div>
            <h1 style={{
              fontSize: '34px',
              fontWeight: '700',
              color: '#111827',
              marginTop: '-7px',
            }}>
              Welcome Back!
            </h1>
            <p
              style={{
                color: "#000000",
                fontSize: "18px",
                margin: "0",
                fontWeight: "400",
                lineHeight: "34px",
              }}
            >
              Optimize your conversions with AI
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#606060",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "16px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "10px",
                  outline: "none",
                  backgroundColor: "#FFFFFF",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#667eea";
                  e.target.style.backgroundColor = "white";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e0e0e0";
                  e.target.style.backgroundColor = "#f8f9fa";
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "16px",
                  fontWeight: "700",
                  color: "#606060",
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "16px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "10px",
                  outline: "none",
                  backgroundColor: "#FFFFFF",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#667eea";
                  e.target.style.backgroundColor = "white";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e0e0e0";
                  e.target.style.backgroundColor = "#f8f9fa";
                }}
              />
            </div>

            <div style={{ textAlign: "right", marginBottom: "30px" }}>
              <Link
                to="/forgetpassword"
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563EB",
                  fontSize: "16px",
                  cursor: "pointer",
                  fontWeight: "700",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.textDecoration = "underline")
                }
                onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
              >
                Forgot Password?
              </Link>
            </div>

            {/* ERROR AND SUCCESS MESSAGES */}
            {error && (
              <p
                style={{
                  color: "red",
                  fontSize: "14px",
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            )}
            {success && (
              <p
                style={{
                  color: "green",
                  fontSize: "14px",
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                {success}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #2F46BC 0%, #E43D54 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.3s ease",
                marginBottom: "30px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 8px 20px rgba(102, 126, 234, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              Login
            </button>
          </form>

          <div style={{ textAlign: "center" }}>
            <span style={{ color: "#000000", fontSize: "16px" }}>
              Don't have an account?{" "}
              <Link
                to="/signup"
                style={{
                  color: "#667eea",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "400",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.textDecoration = "underline")
                }
                onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
              >
                Sign up here
              </Link>
            </span>
          </div>
        </div>

        {/* Right: Growth Image */}
        {!isMobile && (<div style={{
          backgroundImage: "url('/assets/growth.png')",
          width: '850px',
          height: '800px',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}></div>)}
      </div>
    </div>
  );
};

export default LoginComponent;
