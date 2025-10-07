import React from "react";
import { Link } from "react-router-dom";


export default function Login() {
  return (
    <div className="login-container">
      {/* Header */}
      <div className="login-header">
        <div className="site-title">CRO AGENCY</div>
        <div className="header-actions">
          <Link to="/signup" className="signup-link">
            Signup
          </Link>
          <Link to="/demo" className="request-btn">
            Request Demo
          </Link>
        </div>
      </div>

      {/* Login Card */}
      <div className="login-card">
        <h1 className="login-title">Welcome Back 👋</h1>
        <p className="login-subtitle">Sign in to continue</p>

        <form>
          <input type="email" placeholder="Email" className="input" />
          <input type="password" placeholder="Password" className="input" />
          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>

        <button className="google-btn mt-2">Sign in with Google</button>
      </div>
    </div>
  );
}
