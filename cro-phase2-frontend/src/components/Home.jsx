import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";

const Home = () => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isTablet = windowWidth <= 1024;
  const isMobile = windowWidth <= 768;

  const styles = {
    app: {
      minHeight: '100vh',
      margin: 0,
     background: '#0f0f23',
      color: 'white',
      overflowX: 'hidden',

      maxWidth: '1920px',
      marginInline: 'auto', 
    },

    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      maxWidth: '1920px',
      marginRight: '88px',
      marginLeft: '88px',
      marginTop: '-37px',
    },

logo: {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',   // space between icon and text
},

logoIcon: {
  backgroundImage: "url('/assets/crologo.png')",
  width: '150px',
  height: '150px',
  backgroundSize: 'contain',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
},


    nav: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
    },
    loginBtn: {
      background: 'transparent',
      border: 'none',
      color: 'rgba(255, 255, 255, 0.8)',
      padding: '0.5rem 1rem',
      cursor: 'pointer',
      borderRadius: '6px',
      transition: 'all 0.3s ease',
    },
    signupBtn: {
      background: 'linear-gradient(135deg, #2F46BC 0%, #E43D54 100%)',
      border: 'none',
      color: 'white',
      padding: '0.6rem 1.2rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 500,
      transition: 'all 0.3s ease',
    },
    hero: {
      position: 'relative',
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem',
      overflow: 'hidden',
      backgroundImage: "url('/assets/section.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'top center', 
      backgroundRepeat: 'no-repeat',
    },

    heroContent: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: '6rem',
      maxWidth: '1800px',
      width: '100%',
      alignItems: 'center',
      position: 'relative',
      zIndex: 10,
      marginBottom: isMobile ? '3rem' : '8rem',
      marginTop: isMobile ? '120px' : '199px',

    },
    heroTitle: {
      fontSize: isMobile ? '40px' : isTablet ? '56px' : '74px',
      fontWeight: 500,
      lineHeight: isMobile ? '46px' : isTablet ? '60px' : '75px',
      marginBottom: '1.5rem',
      background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginLeft: isMobile ? '0' : '88px',

    },
    heroDescription: {
      fontSize: isMobile ? '16px' : isTablet ? '20px' : '24px',
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: isMobile ? '26px' : '33px',
      marginBottom: '2rem',
      maxWidth: isMobile ? '100%' : '712px',
      fontWeight: 400,
      marginLeft: isMobile ? '0' : '88px',
    },
    heroButtons: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginLeft: isMobile ? '0' : '88px',
    },
    startBtn: {
      background: 'linear-gradient(135deg, #2F46BC 0%, #E43D54 100%)',
      border: 'none',
      color: 'white',
      padding: '0.9rem 2rem',
      borderRadius: '8px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '1rem',
    },
    demoBtn: {
      background: 'transparent',
      border: '1px solid #D1D5DB',
      color: 'white',
      padding: '0.9rem 1.5rem',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    heroVisual: {
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: isMobile ? '2rem' : 0,
    },

logoIcons: {
  backgroundImage: "url('/assets/crologo.png')",
  width: '150px',
  height: '50px',
  backgroundSize: 'contain',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
},


    avatar: {
      width: '32px',
      height: '32px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.9rem',
    },
    botAvatar: {
      width: '32px',
      height: '32px',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.9rem',
      flexShrink: 0,
    },
    responseText: {
      background: 'rgba(255, 255, 255, 0.15)',
      padding: '1rem',
      borderRadius: '12px',
      fontSize: '0.9rem',
      lineHeight: 1.5,
    },
    features: {
      width: '100%',
      maxWidth: '1800px',
      margin: '0 auto',
      padding: isMobile ? '2rem 1rem' : '4rem 0',

    },
    featuresTitle: {
      fontSize: isMobile ? '32px' : isTablet ? '48px' : '64px',
      fontWeight: 700,
      textAlign: 'left',
      marginBottom: '3rem',
      color: 'white',
      marginLeft: isMobile ? '0' : '88px',

    },
    featuresRow: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      gap: isMobile ? '1.25rem' : '3rem',
      marginLeft: isMobile ? '0' : '88px',
      marginRight: isMobile ? '0' : '88px',
    },
    featureCard: {
      flex: 1,
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem' : '2rem',
      textAlign: 'left',
      boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
    },

    featureIcon: {
      width: '250px',
      height: '71px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1.5rem',
      marginLeft: '-96px',
      fontSize: '1.5rem',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: '40%',   
    },

    blueIcon: {
      backgroundImage: "url('/assets/automated.png')",

    },

    redIcon: {
      backgroundImage: "url('/assets/smart.png')",
    },

    purpleIcon: {
      backgroundImage: "url('/assets/expert.png')",
    },

    featureTitle: {
      fontSize: isMobile ? '1.25rem' : '2rem',
      fontWeight: 600,
      marginBottom: '1rem',
      color: 'white',
    },
    featureDescription: {
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: 1.6,
      fontSize: isMobile ? '14px' : '18px',
    },

 footer: {
   borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '1.5rem 0',         
 
  width: '100%',
  background: '#0f0f23',
  marginTop: '-1px'
},

footerContent: {
  width: '100%',
  maxWidth: '1920px',
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  alignItems: 'center',
  textAlign: 'center',
  gap: '2rem',
  padding: '0 88px',
  height: '100%', 
},

footerBrand: {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  marginRight: '330px',
},

footerLogo: {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontWeight: 600,
  fontSize: '1.1rem',
},

footerDescription: {
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '13px',
  marginRight: '-51px',
  marginTop: '-11px',
},

footerLinks: {
  display: 'flex',
  flexDirection: 'row',
  marginBottom: '-42px',
  gap: '6.9rem',
},

link: {
  color: 'rgba(255, 255, 255, 0.7)',
  textDecoration: 'none',
  fontSize: '14px',
  transition: 'color 0.3s ease',
  fontWeight: 400,
      marginLeft: '140px',

},

socialLinks: {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  marginLeft: '388px'
},

socialTitle: {
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '0.9rem',
},

socialIcon: {
  width: '36px',
  height: '36px',
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  textDecoration: 'none',
  fontWeight: 600,
  transition: 'all 0.3s ease',
},

 
  };

  return (
    <div style={styles.app}>
<header style={styles.header}>
  {/* Left side: Logo + text */}
  <div style={styles.logo}>
    <div style={styles.logoIcon}></div>
    <span style={{ fontSize: '1.2rem', fontWeight: 600 }}></span>
        </div>

  {/* Right side: Login/Signup buttons */}
  <nav style={styles.nav}>
    <Link to="/login">
      <button style={styles.loginBtn}>Login</button>
    </Link>
    <Link to="/signup">
      <button style={styles.signupBtn}>Signup</button>
    </Link>
  </nav>
</header>


      <main style={styles.hero}>
        {/* Hero Content */}
        <div style={styles.heroContent}>
          <div>
            <h1 style={styles.heroTitle}>
              Your AI Co-Pilot for
              <br />
              Conversion Growth
            </h1>
            <p style={styles.heroDescription}>
              Upload your Shopify, GA, HotJar data and get instant insights in
              plain English. No more guessing what's hurting your conversions.
            </p>
            <div style={styles.heroButtons}>
              <button style={styles.startBtn}>Start Free →</button>
              <button style={styles.demoBtn}>▶ See Demo</button>
            </div>
          </div>

          <div style={styles.heroVisual}>
            <div style={styles.chatBubble}>
  <img 
    src="/assets/chat.png" 
    alt="Chat Conversation" 
    style={{ width: '650px', height: '300px', borderRadius: '16px' }} 
  />
              </div>

          </div>
        </div>

        {/* Features inside main, column layout */}
        <section style={styles.features}>
          <h2 style={styles.featuresTitle}>See How It Works</h2>
          <div style={styles.featuresRow}>
            <div style={styles.featureCard}>
              <div style={{ ...styles.featureIcon, ...styles.blueIcon }}></div>
              <h3 style={styles.featureTitle}>Automated Insights</h3>
              <p style={styles.featureDescription}>
                AI analyzes your data 24/7 to uncover hidden conversion
                opportunities and bottlenecks.
              </p>
          </div>

            <div style={styles.featureCard}>
              <div style={{ ...styles.featureIcon, ...styles.redIcon }}></div>
              <h3 style={styles.featureTitle}>Smart Recommendations</h3>
              <p style={styles.featureDescription}>
                Get personalized, data-driven suggestions to improve your
                conversion rates instantly.
              </p>
          </div>

            <div style={styles.featureCard}>
              <div style={{ ...styles.featureIcon, ...styles.purpleIcon }}>👥</div>
              <h3 style={styles.featureTitle}>Expert & Beginner Ready</h3>
              <p style={styles.featureDescription}>
                Whether you're a CRO expert or just starting out, our AI adapts
                to your skill level.
              </p>
          </div>
        </div>
      </section>

      </main>
<footer style={styles.footer}>
  <div style={styles.footerContent}>

    {/* Left Column */}
    <div style={styles.footerBrand}>
      <div style={styles.footerLogo}>
        <div style={styles.logoIcons}></div>
       
      </div>
      <p style={styles.footerDescription}>Optimize Conversions with AI.</p>
    </div>

    {/* Middle Column */}
   {/* Middle Column */}
<div style={styles.footerLinks}>
  <p style={styles.link}>Multiops © 2025 CRO, all rights reserved</p>
          </div>


    {/* Right Column */}
 {/* Right Column */}
<div style={styles.socialLinks}>
  <span style={styles.socialTitle}>Connect</span>
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    {/* LinkedIn */}
    <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" style={styles.socialIcon}>
      <img 
        src="/assets/linkdin.png" 
        alt="LinkedIn" 
        style={{ width: '20px', height: '20px' }} 
      />
    </a>

    {/* Facebook */}
    <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" style={styles.socialIcon}>
      <img 
        src="/assets/facebook.png" 
        alt="Facebook" 
        style={{ width: '20px', height: '20px' }} 
      />
    </a>
        </div>
        </div>


        </div>
      </footer>

    </div>

  );
};

export default Home;
