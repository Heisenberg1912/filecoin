import { useState } from 'react'
import { registerWithEmail, isRegistered, getClient } from '../lib/web3storage'
import './RegisterModal.css'

function RegisterModal({ isOpen, onClose, onRegistered }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState('email') // 'email' | 'verify' | 'success'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || loading) return

    setLoading(true)
    setError(null)

    try {
      // Just initiate login, don't wait for plan
      const client = await getClient()
      if (!client) {
        throw new Error('Web3.Storage client not available')
      }
      await client.login(email)
      setStep('verify')
    } catch (err) {
      setError(err.message)
      setStep('email')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckVerification = async () => {
    setChecking(true)
    setError(null)

    try {
      // Try to complete registration after email verification
      await registerWithEmail(email)

      const registered = await isRegistered()
      if (registered) {
        setStep('success')
        setTimeout(() => {
          onRegistered()
          onClose()
        }, 1500)
      } else {
        setError('Not verified yet. Please click the link in your email first.')
      }
    } catch (err) {
      setError(err.message || 'Verification check failed. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setEmail('')
      setError(null)
      setStep('email')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose} disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="modal-header">
          <div className="modal-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="url(#modalGradient)" strokeWidth="2"/>
              <path d="M8 12H16M8 8H16M8 16H12" stroke="url(#modalGradient)" strokeWidth="2" strokeLinecap="round"/>
              <defs>
                <linearGradient id="modalGradient" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#6366f1"/>
                  <stop offset="1" stopColor="#a855f7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2>Connect to Filecoin</h2>
          <p>Register with Web3.Storage to upload files to the Filecoin network.</p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="setup-notice">
              <p><strong>First time?</strong> Create a free account at Storacha first:</p>
              <a
                href="https://console.storacha.network"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary setup-link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create Storacha Account
              </a>
            </div>

            <div className="divider-text">
              <span>Already have an account? Login below</span>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="modal-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary modal-submit" disabled={loading || !email}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M15 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Login with Email
                </>
              )}
            </button>

            <p className="modal-hint">
              Free tier includes 5GB storage.
            </p>
          </form>
        )}

        {step === 'verify' && (
          <div className="modal-verify">
            <div className="verify-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="url(#emailGradient)" strokeWidth="2"/>
                <path d="M22 6L12 13L2 6" stroke="url(#emailGradient)" strokeWidth="2" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="emailGradient" x1="2" y1="4" x2="22" y2="20">
                    <stop stopColor="#6366f1"/>
                    <stop offset="1" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h3>Check Your Email</h3>
            <p>We sent a verification link to <strong>{email}</strong>.</p>
            <p className="verify-hint">Click the link in your email, then click the button below.</p>

            {error && (
              <div className="modal-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary modal-submit"
              onClick={handleCheckVerification}
              disabled={checking}
            >
              {checking ? (
                <>
                  <span className="spinner" />
                  Checking...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  I've Verified My Email
                </>
              )}
            </button>

            <button
              className="btn btn-ghost"
              onClick={() => { setStep('email'); setError(null); }}
              disabled={checking}
            >
              Use different email
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="modal-success">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2"/>
                <path d="M8 12L11 15L16 9" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Registration Complete!</h3>
            <p>Your Filecoin space is ready. You can now upload files.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RegisterModal
