import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookLogs,
  WEBHOOK_EVENTS,
  EVENT_DESCRIPTIONS,
  getSamplePayload
} from '../lib/webhooks'
import { getApiStats, exportProofs } from '../lib/api'
import './Developer.css'

function Developer() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('webhooks')
  const [webhooks, setWebhooks] = useState([])
  const [apiStats, setApiStats] = useState(null)
  const [showNewWebhook, setShowNewWebhook] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState(null)
  const [webhookLogs, setWebhookLogs] = useState([])
  const [apiKey, setApiKey] = useState('')
  const [copied, setCopied] = useState(null)

  // New webhook form
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [],
    secret: ''
  })
  const [webhookError, setWebhookError] = useState(null)

  useEffect(() => {
    loadData()
    // Generate a demo API key
    const storedKey = localStorage.getItem('proofvault_api_key')
    if (storedKey) {
      setApiKey(storedKey)
    } else {
      const newKey = `pv_${generateRandomString(32)}`
      localStorage.setItem('proofvault_api_key', newKey)
      setApiKey(newKey)
    }
  }, [])

  const loadData = () => {
    setWebhooks(getWebhooks())
    setApiStats(getApiStats().data)
    setWebhookLogs(getWebhookLogs())
  }

  const generateRandomString = (length) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const handleCreateWebhook = () => {
    try {
      setWebhookError(null)
      createWebhook(newWebhook)
      setNewWebhook({ name: '', url: '', events: [], secret: '' })
      setShowNewWebhook(false)
      loadData()
    } catch (err) {
      setWebhookError(err.message)
    }
  }

  const handleToggleWebhook = (id, enabled) => {
    updateWebhook(id, { enabled })
    loadData()
  }

  const handleDeleteWebhook = (id) => {
    if (window.confirm('Delete this webhook?')) {
      deleteWebhook(id)
      loadData()
    }
  }

  const handleTestWebhook = async (id) => {
    const result = await testWebhook(id)
    if (result.success) {
      alert('Test event sent!')
    } else {
      alert(`Test failed: ${result.error}`)
    }
  }

  const handleToggleEvent = (event) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }))
  }

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const regenerateApiKey = () => {
    if (window.confirm('Generate a new API key? The old key will stop working.')) {
      const newKey = `pv_${generateRandomString(32)}`
      localStorage.setItem('proofvault_api_key', newKey)
      setApiKey(newKey)
    }
  }

  const handleExport = (format) => {
    const data = exportProofs(format)
    const blob = new Blob([data], {
      type: format === 'csv' ? 'text/csv' : 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proofvault-export-${Date.now()}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="developer-page">
      <div className="container">
        {/* Hero */}
        <section className="dev-hero animate-slideUp">
          <div className="hero-badge">
            <span className="badge-dot" />
            Developer Tools
          </div>
          <h1 className="hero-title">
            Build with <span className="gradient-text">ProofVault</span>
          </h1>
          <p className="hero-subtitle">
            Configure webhooks, manage API keys, and integrate ProofVault into your applications.
          </p>
        </section>

        {/* Tabs */}
        <div className="dev-tabs animate-fadeIn">
          <button
            className={`tab ${activeTab === 'webhooks' ? 'active' : ''}`}
            onClick={() => setActiveTab('webhooks')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Webhooks
          </button>
          <button
            className={`tab ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
            </svg>
            API Keys
          </button>
          <button
            className={`tab ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Export
          </button>
        </div>

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="tab-content animate-fadeIn">
            <div className="section-header">
              <h2>Webhooks</h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowNewWebhook(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Add Webhook
              </button>
            </div>

            <p className="section-desc">
              Receive real-time notifications when events occur in ProofVault.
            </p>

            {/* New Webhook Form */}
            {showNewWebhook && (
              <div className="webhook-form">
                <h3>New Webhook</h3>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    placeholder="My Webhook"
                  />
                </div>
                <div className="form-group">
                  <label>URL</label>
                  <input
                    type="url"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                    placeholder="https://your-server.com/webhook"
                  />
                </div>
                <div className="form-group">
                  <label>Secret (optional)</label>
                  <input
                    type="text"
                    value={newWebhook.secret}
                    onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                    placeholder="Used for HMAC signature verification"
                  />
                </div>
                <div className="form-group">
                  <label>Events</label>
                  <div className="events-grid">
                    {Object.entries(EVENT_DESCRIPTIONS).map(([event, info]) => (
                      <label key={event} className="event-checkbox">
                        <input
                          type="checkbox"
                          checked={newWebhook.events.includes(event)}
                          onChange={() => handleToggleEvent(event)}
                        />
                        <div className="event-info">
                          <span className="event-name">{info.name}</span>
                          <span className="event-desc">{info.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                {webhookError && (
                  <div className="form-error">{webhookError}</div>
                )}
                <div className="form-actions">
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShowNewWebhook(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateWebhook}
                    disabled={!newWebhook.url || newWebhook.events.length === 0}
                  >
                    Create Webhook
                  </button>
                </div>
              </div>
            )}

            {/* Webhooks List */}
            <div className="webhooks-list">
              {webhooks.length === 0 ? (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <h3>No webhooks configured</h3>
                  <p>Add a webhook to receive event notifications</p>
                </div>
              ) : (
                webhooks.map((webhook) => (
                  <div key={webhook.id} className="webhook-card">
                    <div className="webhook-header">
                      <div className="webhook-info">
                        <span className={`status-dot ${webhook.enabled ? 'active' : 'inactive'}`} />
                        <h4>{webhook.name || 'Unnamed Webhook'}</h4>
                      </div>
                      <div className="webhook-actions">
                        <button
                          className="icon-btn"
                          onClick={() => handleTestWebhook(webhook.id)}
                          title="Send test event"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => handleToggleWebhook(webhook.id, !webhook.enabled)}
                          title={webhook.enabled ? 'Disable' : 'Enable'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            {webhook.enabled ? (
                              <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64M12 2V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            ) : (
                              <>
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                <path d="M8 12L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </>
                            )}
                          </svg>
                        </button>
                        <button
                          className="icon-btn danger"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          title="Delete"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="webhook-body">
                      <div className="webhook-url">
                        <code>{webhook.url}</code>
                      </div>
                      <div className="webhook-events">
                        {webhook.events.map((event) => (
                          <span key={event} className="event-tag">
                            {EVENT_DESCRIPTIONS[event]?.name || event}
                          </span>
                        ))}
                      </div>
                      <div className="webhook-stats">
                        <span>Success: {webhook.successCount || 0}</span>
                        <span>Failed: {webhook.failCount || 0}</span>
                        {webhook.lastTriggered && (
                          <span>Last: {new Date(webhook.lastTriggered).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="tab-content animate-fadeIn">
            <div className="section-header">
              <h2>API Keys</h2>
              <button className="btn btn-secondary" onClick={() => navigate('/api')}>
                View API Docs
              </button>
            </div>

            <p className="section-desc">
              Use your API key to authenticate requests to the ProofVault API.
            </p>

            <div className="api-key-card">
              <div className="key-header">
                <span className="key-label">Your API Key</span>
                <span className="key-env">Development</span>
              </div>
              <div className="key-value">
                <code>{apiKey}</code>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(apiKey, 'key')}
                >
                  {copied === 'key' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="key-actions">
                <button className="btn btn-ghost" onClick={regenerateApiKey}>
                  Regenerate Key
                </button>
              </div>
            </div>

            {/* Usage Stats */}
            {apiStats && (
              <div className="usage-stats">
                <h3>Usage Statistics</h3>
                <div className="stats-grid">
                  <div className="usage-stat">
                    <span className="stat-value">{apiStats.totalProofs}</span>
                    <span className="stat-label">Total Proofs</span>
                  </div>
                  <div className="usage-stat">
                    <span className="stat-value">{apiStats.webhooksConfigured}</span>
                    <span className="stat-label">Webhooks</span>
                  </div>
                  <div className="usage-stat">
                    <span className="stat-value">{apiStats.apiVersion}</span>
                    <span className="stat-label">API Version</span>
                  </div>
                </div>
              </div>
            )}

            <div className="api-note">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>
                This is a client-side demo. In production, API keys would be managed
                server-side with proper authentication and rate limiting.
              </p>
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="tab-content animate-fadeIn">
            <div className="section-header">
              <h2>Export Data</h2>
            </div>

            <p className="section-desc">
              Download your proof data for backup or integration with other systems.
            </p>

            <div className="export-options">
              <div className="export-card" onClick={() => handleExport('json')}>
                <div className="export-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="export-info">
                  <h3>JSON Export</h3>
                  <p>Full proof data with all metadata</p>
                </div>
                <code>.json</code>
              </div>

              <div className="export-card" onClick={() => handleExport('csv')}>
                <div className="export-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 13H16M8 17H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="export-info">
                  <h3>CSV Export</h3>
                  <p>Spreadsheet-compatible format</p>
                </div>
                <code>.csv</code>
              </div>
            </div>

            {apiStats && (
              <p className="export-count">
                {apiStats.totalProofs} proofs will be exported
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Developer
