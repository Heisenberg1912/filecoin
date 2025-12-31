import { Outlet, NavLink } from 'react-router-dom'
import WalletButton from './WalletButton'
import './Layout.css'

function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <NavLink to="/" className="logo">
            <div className="logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="logoGrad" x1="2" y1="2" x2="22" y2="22">
                    <stop stopColor="#00ff88"/>
                    <stop offset="1" stopColor="#00cc6a"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="logo-text">ProofVault</span>
          </NavLink>

          <nav className="nav">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create
            </NavLink>
            <NavLink
              to="/batch"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Batch
            </NavLink>
            <NavLink
              to="/verify"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Verify
            </NavLink>
            <NavLink
              to="/explorer"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Explorer
            </NavLink>
            <NavLink
              to="/compare"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M8 3H5C3.89543 3 3 3.89543 3 5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 3H19C20.1046 3 21 3.89543 21 5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 21H5C3.89543 21 3 20.1046 3 19V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 21H19C20.1046 21 21 20.1046 21 19V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Compare
            </NavLink>
          </nav>

          <div className="header-right">
            <WalletButton />
            <a
              href="https://builtattic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="company-link"
            >
              <span className="company-dot"></span>
              Builtattic
            </a>
          </div>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="footer-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span>ProofVault</span>
          </div>
          <p className="footer-tagline">Decentralized file certification powered by Filecoin</p>
          <div className="footer-bottom">
            <div className="footer-links">
              <a href="https://filecoin.io" target="_blank" rel="noopener noreferrer">Filecoin</a>
              <span className="footer-divider">•</span>
              <a href="https://storacha.network" target="_blank" rel="noopener noreferrer">Storacha</a>
            </div>
            <a
              href="https://builtattic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-company"
            >
              Built by <strong>Builtattic</strong>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
