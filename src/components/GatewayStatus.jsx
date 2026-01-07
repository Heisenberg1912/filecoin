import { useState, useEffect } from 'react'
import {
  GATEWAYS,
  getGatewaysWithHealth,
  getPreferredGateway,
  setPreferredGateway
} from '../lib/gateways'
import './GatewayStatus.css'

function GatewayStatus({ compact = false, onGatewayChange }) {
  const [gateways, setGateways] = useState([])
  const [loading, setLoading] = useState(true)
  const [preferred, setPreferred] = useState(getPreferredGateway())
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    checkGateways()
  }, [])

  const checkGateways = async () => {
    setLoading(true)
    try {
      const results = await getGatewaysWithHealth()
      setGateways(results)
    } catch (err) {
      console.error('Failed to check gateways:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectGateway = (gateway) => {
    setPreferred(gateway)
    setPreferredGateway(gateway.id)
    if (onGatewayChange) {
      onGatewayChange(gateway)
    }
    setExpanded(false)
  }

  const healthyCount = gateways.filter(g => g.health?.healthy).length

  if (compact) {
    return (
      <div className="gateway-status-compact">
        <div
          className={`gateway-indicator ${loading ? 'loading' : healthyCount > 0 ? 'healthy' : 'unhealthy'}`}
          onClick={() => setExpanded(!expanded)}
          title={`${healthyCount}/${gateways.length} gateways online`}
        >
          <span className="indicator-dot" />
          <span className="indicator-text">
            {loading ? 'Checking...' : `${healthyCount} online`}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={expanded ? 'rotated' : ''}>
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {expanded && (
          <div className="gateway-dropdown">
            <div className="gateway-dropdown-header">
              <span>IPFS Gateways</span>
              <button className="refresh-btn" onClick={checkGateways} disabled={loading}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={loading ? 'spinning' : ''}>
                  <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="gateway-list">
              {gateways.map(gateway => (
                <div
                  key={gateway.id}
                  className={`gateway-item ${preferred.id === gateway.id ? 'selected' : ''} ${gateway.health?.healthy ? '' : 'offline'}`}
                  onClick={() => handleSelectGateway(gateway)}
                >
                  <div className="gateway-info">
                    <span className={`status-dot ${gateway.health?.healthy ? 'online' : 'offline'}`} />
                    <span className="gateway-name">{gateway.name}</span>
                    {preferred.id === gateway.id && (
                      <span className="preferred-badge">Preferred</span>
                    )}
                  </div>
                  <div className="gateway-meta">
                    {gateway.health?.healthy ? (
                      <span className="latency">{gateway.health.latency}ms</span>
                    ) : (
                      <span className="error">{gateway.health?.error || 'Offline'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="gateway-status">
      <div className="gateway-status-header">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M2 12H22" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 2C14.5 4.5 15.5 8 15.5 12C15.5 16 14.5 19.5 12 22C9.5 19.5 8.5 16 8.5 12C8.5 8 9.5 4.5 12 2Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          IPFS Gateway Status
        </h3>
        <button className="btn-refresh" onClick={checkGateways} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={loading ? 'spinning' : ''}>
            <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Refresh
        </button>
      </div>

      <div className="gateway-summary">
        <div className={`summary-badge ${healthyCount === gateways.length ? 'all-healthy' : healthyCount > 0 ? 'partial' : 'all-down'}`}>
          {loading ? 'Checking gateways...' : `${healthyCount} of ${gateways.length} gateways online`}
        </div>
      </div>

      <div className="gateway-grid">
        {gateways.map(gateway => (
          <div
            key={gateway.id}
            className={`gateway-card ${preferred.id === gateway.id ? 'preferred' : ''} ${gateway.health?.healthy ? 'healthy' : 'unhealthy'}`}
            onClick={() => handleSelectGateway(gateway)}
          >
            <div className="gateway-card-header">
              <span className={`status-indicator ${gateway.health?.healthy ? 'online' : 'offline'}`} />
              <span className="gateway-title">{gateway.name}</span>
              {preferred.id === gateway.id && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="check-icon">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div className="gateway-card-body">
              <span className="gateway-type">{gateway.type}</span>
              {gateway.health?.healthy ? (
                <span className="gateway-latency">{gateway.health.latency}ms</span>
              ) : (
                <span className="gateway-error">{gateway.health?.error || 'Unavailable'}</span>
              )}
            </div>
            {preferred.id === gateway.id && (
              <div className="preferred-indicator">Preferred Gateway</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default GatewayStatus
