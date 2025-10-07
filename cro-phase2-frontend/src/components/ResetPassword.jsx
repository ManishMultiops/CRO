import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react"; // 👁️ icons

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation rules
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError(""); // clear error
    console.log("Password reset successfully ✅:", { password });
    // Add API logic here
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#374151",
    textAlign: "left",
    
  };

  const inputContainer = {
    position: "relative",
    width: "100%",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 45px 12px 16px",
    fontSize: "16px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box",
  };

  const iconStyle = {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    color: "#6B7280",
  };

  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;

  return (
    <div
      style={{
        backgroundImage: "url('/assets/loginmain.jpg')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "20px" : "60px",
      
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          maxWidth: "1400px",
          gap: isMobile ? "24px" : "60px",
        }}
      >
        {/* Left: Reset Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: isMobile ? "24px" : "40px",
            width: isMobile ? "100%" : "500px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: "30px" }}>
            <div
              style={{
                margin: "0 auto 20px",
                backgroundImage: "url('/assets/loginlogo.png')",
                width: "120px",
                height: "120px",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            ></div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Reset Password?
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>
                Enter Password <span style={{ color: "red" }}>*</span>
              </label>
              <div style={inputContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={inputStyle}
                />
                <div
                  style={iconStyle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>
                Confirm Password <span style={{ color: "red" }}>*</span>
              </label>
              <div style={inputContainer}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  style={inputStyle}
                />
                <div
                  style={iconStyle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p
                style={{
                  color: "red",
                  fontSize: "14px",
                  textAlign: "left",
                  marginBottom: "15px",
                }}
              >
                {error}
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
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "0.3s ease",
                marginBottom: "20px",
              }}
            >
              Submit
            </button>
          </form>
        </div>

        {/* Right: Growth Image */}
        {!isMobile && (<div
          style={{
            backgroundImage: "url('/assets/growth.png')",
            width: "800px",
            height: "700px",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        ></div>)}
      </div>
    </div>
  );
};

export default ResetPassword;
