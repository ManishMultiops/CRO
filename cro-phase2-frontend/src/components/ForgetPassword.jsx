import React, { useState } from 'react';
import { Link } from "react-router-dom";

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Email validation regex
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    console.log('Reset link sent to:', email);
    // Add reset logic here
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
      padding: isMobile ? '20px' : '60px',
      
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxWidth: '1400px',
        gap: isMobile ? '24px' : '60px',
      }}>
        
        {/* Left: Reset Card */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: isMobile ? '24px' : '40px',
          width: isMobile ? '100%' : '500px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{
              margin: '0 auto 20px',
              backgroundImage: "url('/assets/loginlogo.png')",
              width: '120px',
              height: '120px',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}></div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827',
             
            }}>
              Forgot Password?
            </h1>
            <p style={{
              color: '#000000',
              fontSize: '16px',
              margin: '10px 0',
              lineHeight: '26px',
            }}>
              No worries we’ll send a link to <br /> reset your password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
              }}>
                Email / Username
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Alex.Johnson@gmail.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  outline: 'none',
                }}
              />
              {/* Error message */}
              {error && (
                <p style={{
                  color: 'red',
                  fontSize: '13px',
                  marginTop: '6px',
                  fontWeight: '500'
                }}>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #2F46BC 0%, #E43D54 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: '0.3s ease',
                marginBottom: '20px'
              }}
            >
              Send Reset Link
            </button>
          </form>

          {/* Sign in link */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: '#000000', fontSize: '14px', fontWeight: '500' }}>
              Remembered your password?{' '}
              <Link
                to="/signup"
                style={{
                  color: '#1E2FCA',
                  fontSize: '14px',
                  fontWeight: '700',
                  textDecoration: 'none'
                }}
              >
                Sign In
              </Link>
            </span>
          </div>

          {/* Footer text */}
          <p style={{
            color: '#000000',
            fontSize: '13px',
            lineHeight: '22px',
          }}>
            We’ll never share your email. <br />
            Link expires in 60 minutes.
          </p>
        </div>

        {/* Right: Growth Image */}
        {!isMobile && (<div style={{
          backgroundImage: "url('/assets/growth.png')",
          width: '800px',
          height: '700px',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}></div>)}
      </div>
    </div>
  );
};

export default ForgetPassword;
