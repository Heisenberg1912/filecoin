import { useState } from 'react'
import { API_ENDPOINTS, API_VERSION } from '../lib/api'
import './API.css'

function API() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null)
  const [activeTab, setActiveTab] = useState('javascript')
  const [copied, setCopied] = useState(null)

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getCodeExample = (endpoint, language) => {
    const examples = {
      javascript: {
        'Create Proof': `const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/v1/proofs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
});

const { data } = await response.json();
console.log('Proof ID:', data.proofId);`,

        'Get Proof': `const response = await fetch('/api/v1/proofs/PV-123456789-ABC', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const { data } = await response.json();
console.log('Hash:', data.sha256Hash);`,

        'Verify Proof': `const formData = new FormData();
formData.append('file', fileToVerify);

const response = await fetch('/api/v1/proofs/PV-123456789-ABC/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
});

const { verified } = await response.json();
console.log('Verified:', verified);`,

        'List Proofs': `const params = new URLSearchParams({
  page: 1,
  limit: 10,
  sortBy: 'timestamp'
});

const response = await fetch(\`/api/v1/proofs?\${params}\`, {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const { data, pagination } = await response.json();`,

        default: `const response = await fetch('${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});`
      },
      python: {
        'Create Proof': `import requests

files = {'file': open('document.pdf', 'rb')}
headers = {'Authorization': 'Bearer YOUR_API_KEY'}

response = requests.post(
    'https://api.proofvault.io/v1/proofs',
    files=files,
    headers=headers
)

data = response.json()['data']
print(f"Proof ID: {data['proofId']}")`,

        'Get Proof': `import requests

headers = {'Authorization': 'Bearer YOUR_API_KEY'}

response = requests.get(
    'https://api.proofvault.io/v1/proofs/PV-123456789-ABC',
    headers=headers
)

data = response.json()['data']
print(f"Hash: {data['sha256Hash']}")`,

        'Verify Proof': `import requests

files = {'file': open('document.pdf', 'rb')}
headers = {'Authorization': 'Bearer YOUR_API_KEY'}

response = requests.post(
    'https://api.proofvault.io/v1/proofs/PV-123456789-ABC/verify',
    files=files,
    headers=headers
)

result = response.json()
print(f"Verified: {result['verified']}")`,

        default: `import requests

response = requests.${endpoint.method.toLowerCase()}(
    'https://api.proofvault.io${endpoint.path}',
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)`
      },
      curl: {
        'Create Proof': `curl -X POST https://api.proofvault.io/v1/proofs \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf"`,

        'Get Proof': `curl https://api.proofvault.io/v1/proofs/PV-123456789-ABC \\
  -H "Authorization: Bearer YOUR_API_KEY"`,

        'Verify Proof': `curl -X POST https://api.proofvault.io/v1/proofs/PV-123456789-ABC/verify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf"`,

        'List Proofs': `curl "https://api.proofvault.io/v1/proofs?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,

        default: `curl -X ${endpoint.method} https://api.proofvault.io${endpoint.path} \\
  -H "Authorization: Bearer YOUR_API_KEY"`
      }
    }

    return examples[language][endpoint.name] || examples[language].default
  }

  return (
    <div className="api-page">
      <div className="container">
        {/* Hero */}
        <section className="api-hero animate-slideUp">
          <div className="hero-badge">
            <span className="badge-dot" />
            Developer Tools
          </div>
          <h1 className="hero-title">
            ProofVault <span className="gradient-text">API</span>
          </h1>
          <p className="hero-subtitle">
            Integrate file certification into your applications with our simple REST API.
            Generate proofs, verify files, and manage certificates programmatically.
          </p>
          <div className="api-version">
            <code>API Version: {API_VERSION}</code>
            <code>Base URL: https://api.proofvault.io</code>
          </div>
        </section>

        {/* Quick Start */}
        <section className="quick-start animate-fadeIn">
          <h2>Quick Start</h2>
          <div className="quick-start-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Get API Key</h3>
                <p>Generate an API key from the Developer Dashboard</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Upload File</h3>
                <p>POST your file to the /proofs endpoint</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Get Proof</h3>
                <p>Receive proof ID, hash, and IPFS CID</p>
              </div>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="endpoints-section animate-fadeIn">
          <h2>Endpoints</h2>
          <div className="endpoints-grid">
            {API_ENDPOINTS.map((endpoint) => (
              <div
                key={`${endpoint.method}-${endpoint.path}`}
                className={`endpoint-card ${selectedEndpoint === endpoint ? 'selected' : ''}`}
                onClick={() => setSelectedEndpoint(endpoint)}
              >
                <div className="endpoint-header">
                  <span className={`method-badge ${endpoint.method.toLowerCase()}`}>
                    {endpoint.method}
                  </span>
                  <code className="endpoint-path">{endpoint.path}</code>
                </div>
                <h3>{endpoint.name}</h3>
                <p>{endpoint.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Endpoint Detail */}
        {selectedEndpoint && (
          <section className="endpoint-detail animate-fadeIn">
            <div className="detail-header">
              <div>
                <span className={`method-badge large ${selectedEndpoint.method.toLowerCase()}`}>
                  {selectedEndpoint.method}
                </span>
                <code className="detail-path">{selectedEndpoint.path}</code>
              </div>
              <button className="close-btn" onClick={() => setSelectedEndpoint(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <h3>{selectedEndpoint.name}</h3>
            <p className="detail-description">{selectedEndpoint.description}</p>

            {/* Parameters */}
            {selectedEndpoint.params?.length > 0 && (
              <div className="params-section">
                <h4>Parameters</h4>
                <table className="params-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Required</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEndpoint.params.map((param) => (
                      <tr key={param.name}>
                        <td><code>{param.name}</code></td>
                        <td><span className="type-badge">{param.type}</span></td>
                        <td>
                          {param.required ? (
                            <span className="required">Required</span>
                          ) : (
                            <span className="optional">Optional</span>
                          )}
                        </td>
                        <td>{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Code Examples */}
            <div className="code-section">
              <div className="code-tabs">
                {['javascript', 'python', 'curl'].map((lang) => (
                  <button
                    key={lang}
                    className={`tab ${activeTab === lang ? 'active' : ''}`}
                    onClick={() => setActiveTab(lang)}
                  >
                    {lang === 'javascript' ? 'JavaScript' : lang === 'python' ? 'Python' : 'cURL'}
                  </button>
                ))}
              </div>
              <div className="code-block">
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(getCodeExample(selectedEndpoint, activeTab), 'code')}
                >
                  {copied === 'code' ? 'Copied!' : 'Copy'}
                </button>
                <pre><code>{getCodeExample(selectedEndpoint, activeTab)}</code></pre>
              </div>
            </div>

            {/* Response */}
            {selectedEndpoint.response && (
              <div className="response-section">
                <h4>Response</h4>
                <div className="code-block">
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(JSON.stringify(selectedEndpoint.response, null, 2), 'response')}
                  >
                    {copied === 'response' ? 'Copied!' : 'Copy'}
                  </button>
                  <pre><code>{JSON.stringify(selectedEndpoint.response, null, 2)}</code></pre>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Authentication */}
        <section className="auth-section animate-fadeIn">
          <h2>Authentication</h2>
          <div className="auth-content">
            <p>
              All API requests require authentication using an API key. Include your key
              in the Authorization header:
            </p>
            <div className="code-block">
              <pre><code>Authorization: Bearer YOUR_API_KEY</code></pre>
            </div>
            <div className="auth-note">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>
                Keep your API key secure. Never expose it in client-side code or
                public repositories.
              </p>
            </div>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="rate-limits animate-fadeIn">
          <h2>Rate Limits</h2>
          <div className="limits-grid">
            <div className="limit-card">
              <h3>Free Tier</h3>
              <div className="limit-value">100</div>
              <p>requests per hour</p>
            </div>
            <div className="limit-card featured">
              <h3>Pro Tier</h3>
              <div className="limit-value">10,000</div>
              <p>requests per hour</p>
            </div>
            <div className="limit-card">
              <h3>Enterprise</h3>
              <div className="limit-value">Unlimited</div>
              <p>custom limits</p>
            </div>
          </div>
        </section>

        {/* SDKs */}
        <section className="sdks-section animate-fadeIn">
          <h2>SDKs & Libraries</h2>
          <div className="sdk-grid">
            <div className="sdk-card">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
                <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 22V15.5" stroke="currentColor" strokeWidth="2"/>
                <path d="M22 8.5L12 15.5L2 8.5" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>JavaScript SDK</h3>
              <code>npm install @proofvault/sdk</code>
              <span className="status coming-soon">Coming Soon</span>
            </div>
            <div className="sdk-card">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
                <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 22V15.5" stroke="currentColor" strokeWidth="2"/>
                <path d="M22 8.5L12 15.5L2 8.5" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>Python SDK</h3>
              <code>pip install proofvault</code>
              <span className="status coming-soon">Coming Soon</span>
            </div>
            <div className="sdk-card">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
                <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 22V15.5" stroke="currentColor" strokeWidth="2"/>
                <path d="M22 8.5L12 15.5L2 8.5" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <h3>Go SDK</h3>
              <code>go get proofvault.io/sdk</code>
              <span className="status coming-soon">Coming Soon</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default API
