import React, { useState } from "react";
import { Link } from "react-router-dom";
import { signupUser } from "../api/api";

import { useNavigate } from "react-router-dom";

const SignupComponent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName) {
      setError("Full name is required");
      return;
    }
    if (!email) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!agree) {
      setError("You must agree to the Terms & Privacy Policy");
      return;
    }

    try {
      const response = await signupUser({
        full_name: fullName,
        email,
        password,
        confirm_password: confirmPassword,
        agree,
      });
      if (response.status === 200 || response.status === 201) {
        setSuccess("✅ Account created successfully!");
        setError("");
        // Reset form fields
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setAgree(false);
        // Redirect to login page
        navigate("/login");
      } else {
        setError("Signup failed. Please try again.");
        setSuccess("");
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Signup failed. Please try again.";
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
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: isMobile ? '16px' : '20px',
  overflow: 'hidden' 

    }}>
     
      <div style={{
     display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '1400px',
    height: '100%',
    gap: isMobile ? '16px' : '0'

      }}>
        {/* Left: Growth Image */}
        {!isMobile && (<div style={{
       backgroundImage: "url('/assets/signgrowths.png')",
      width: '50%',
      height: '100%',
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center'

        }}></div>)}

        {/* Right: Signup Card */}
        <div style={{
     background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: isMobile ? '24px' : '40px',
      width: isMobile ? '100%' : '494px',
      maxHeight: '100%',
      overflowY: 'auto',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'

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
            }}>
              
            </div>
            <h1 style={{
              fontSize: '34px',
              fontWeight: '700',
              color: '#111827',
              margin: '-13 0 8px 0'
            }}>
              Create Your Account
            </h1>
            <p
              style={{
                color: "#000000",
                fontWeight: "400",
                fontSize: "18px",
                marginTop: "-13px",
                lineHeight: "34px",
              }}
            >
              Optimize your conversions with AI
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>
                Full Name<span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>
                Email<span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>
                Password<span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-Enter your password"
                style={inputStyle}
              />
            </div>

            <div
              style={{
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span style={{ fontSize: "14px", color: "#333" }}>
                I agree to the{" "}
                <a
                  href="#"
                  style={{ color: "#2F46BC", textDecoration: "none" }}
                >
                  Terms
                </a>{" "}
                &{" "}
                <a
                  href="#"
                  style={{ color: "#2F46BC", textDecoration: "none" }}
                >
                  Privacy Policy
                </a>
              </span>
            </div>

            {error && (
              <p
                style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}
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
                lineHeight: "100%",
                cursor: "pointer",
                transition: "all 0.3s ease",
                marginBottom: "30px",
              }}
            >
              Create Account
            </button>
          </form>

          <div style={{ textAlign: "center" }}>
            <span style={{ color: "#000000", fontSize: "16px" }}>
              Already have an account?{" "}
              <Link
                to="/login"
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
                Login here
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "16px",
  fontWeight: "700",
  color: "#606060",
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  fontSize: "16px",
  border: "1px solid #D1D5DB",
  borderRadius: "10px",
  outline: "none",
  backgroundColor: "#FFFFFF",
  boxSizing: "border-box",
};

export default SignupComponent;
