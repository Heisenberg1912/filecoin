/**
 * Webhook System
 * Manages webhook configurations and event dispatching
 */

const WEBHOOKS_STORAGE_KEY = 'proofvault_webhooks'
const WEBHOOK_LOGS_KEY = 'proofvault_webhook_logs'

// Webhook event types
export const WEBHOOK_EVENTS = {
  PROOF_CREATED: 'proof_created',
  PROOF_VERIFIED: 'proof_verified',
  NFT_MINTED: 'nft_minted',
  PROOF_REGISTERED: 'proof_registered',
  BATCH_COMPLETED: 'batch_completed'
}

// Event descriptions for UI
export const EVENT_DESCRIPTIONS = {
  [WEBHOOK_EVENTS.PROOF_CREATED]: {
    name: 'Proof Created',
    description: 'Triggered when a new proof is generated',
    payload: ['proofId', 'sha256Hash', 'cid', 'fileName', 'timestamp']
  },
  [WEBHOOK_EVENTS.PROOF_VERIFIED]: {
    name: 'Proof Verified',
    description: 'Triggered when a proof is verified against a file',
    payload: ['proofId', 'verified', 'timestamp']
  },
  [WEBHOOK_EVENTS.NFT_MINTED]: {
    name: 'NFT Minted',
    description: 'Triggered when a proof NFT is minted',
    payload: ['proofId', 'tokenId', 'txHash', 'timestamp']
  },
  [WEBHOOK_EVENTS.PROOF_REGISTERED]: {
    name: 'Proof Registered On-Chain',
    description: 'Triggered when a proof is registered on the blockchain',
    payload: ['proofId', 'txHash', 'blockNumber', 'timestamp']
  },
  [WEBHOOK_EVENTS.BATCH_COMPLETED]: {
    name: 'Batch Upload Completed',
    description: 'Triggered when a batch upload completes',
    payload: ['batchId', 'totalFiles', 'successCount', 'failCount', 'timestamp']
  }
}

/**
 * Get all configured webhooks
 */
export function getWebhooks() {
  try {
    const data = localStorage.getItem(WEBHOOKS_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Save webhooks to storage
 */
function saveWebhooks(webhooks) {
  localStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(webhooks))
}

/**
 * Create a new webhook
 * @param {Object} config - Webhook configuration
 * @returns {Object} Created webhook
 */
export function createWebhook(config) {
  const { url, events = [], name = 'Unnamed Webhook', secret = null } = config

  if (!url) {
    throw new Error('Webhook URL is required')
  }

  if (!events.length) {
    throw new Error('At least one event must be selected')
  }

  // Validate URL
  try {
    new URL(url)
  } catch {
    throw new Error('Invalid webhook URL')
  }

  const webhook = {
    id: `wh-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name,
    url,
    events,
    secret,
    enabled: true,
    createdAt: new Date().toISOString(),
    lastTriggered: null,
    successCount: 0,
    failCount: 0
  }

  const webhooks = getWebhooks()
  webhooks.push(webhook)
  saveWebhooks(webhooks)

  return webhook
}

/**
 * Update an existing webhook
 * @param {string} id - Webhook ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated webhook
 */
export function updateWebhook(id, updates) {
  const webhooks = getWebhooks()
  const index = webhooks.findIndex(w => w.id === id)

  if (index === -1) {
    throw new Error('Webhook not found')
  }

  const allowedUpdates = ['name', 'url', 'events', 'secret', 'enabled']
  const webhook = webhooks[index]

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      webhook[key] = updates[key]
    }
  }

  webhooks[index] = webhook
  saveWebhooks(webhooks)

  return webhook
}

/**
 * Delete a webhook
 * @param {string} id - Webhook ID
 */
export function deleteWebhook(id) {
  const webhooks = getWebhooks()
  const filtered = webhooks.filter(w => w.id !== id)
  saveWebhooks(filtered)
}

/**
 * Get webhook by ID
 * @param {string} id - Webhook ID
 * @returns {Object|null} Webhook or null
 */
export function getWebhookById(id) {
  const webhooks = getWebhooks()
  return webhooks.find(w => w.id === id) || null
}

/**
 * Trigger webhooks for an event
 * @param {string} event - Event type
 * @param {Object} payload - Event payload
 */
export async function triggerWebhook(event, payload) {
  const webhooks = getWebhooks()
  const eligibleWebhooks = webhooks.filter(
    w => w.enabled && w.events.includes(event)
  )

  if (eligibleWebhooks.length === 0) {
    return
  }

  const eventPayload = {
    event,
    timestamp: new Date().toISOString(),
    data: payload
  }

  for (const webhook of eligibleWebhooks) {
    dispatchWebhook(webhook, eventPayload)
  }
}

/**
 * Dispatch a webhook (fire and forget)
 * @param {Object} webhook - Webhook configuration
 * @param {Object} payload - Event payload
 */
async function dispatchWebhook(webhook, payload) {
  const headers = {
    'Content-Type': 'application/json'
  }

  // Add signature if secret is configured
  if (webhook.secret) {
    const signature = await generateSignature(webhook.secret, JSON.stringify(payload))
    headers['X-ProofVault-Signature'] = signature
  }

  headers['X-ProofVault-Event'] = payload.event
  headers['X-ProofVault-Webhook-Id'] = webhook.id

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      mode: 'no-cors' // Allow sending to any endpoint
    })

    // Log success
    logWebhookEvent(webhook.id, payload.event, true, null)
    updateWebhookStats(webhook.id, true)
  } catch (err) {
    // Log failure
    logWebhookEvent(webhook.id, payload.event, false, err.message)
    updateWebhookStats(webhook.id, false)
  }
}

/**
 * Generate HMAC signature for webhook payload
 */
async function generateSignature(secret, payload) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  )

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Update webhook statistics
 */
function updateWebhookStats(webhookId, success) {
  const webhooks = getWebhooks()
  const index = webhooks.findIndex(w => w.id === webhookId)

  if (index !== -1) {
    webhooks[index].lastTriggered = new Date().toISOString()
    if (success) {
      webhooks[index].successCount++
    } else {
      webhooks[index].failCount++
    }
    saveWebhooks(webhooks)
  }
}

/**
 * Log webhook event
 */
function logWebhookEvent(webhookId, event, success, error) {
  try {
    const logs = getWebhookLogs()
    logs.unshift({
      webhookId,
      event,
      success,
      error,
      timestamp: new Date().toISOString()
    })

    // Keep only last 100 logs
    const trimmed = logs.slice(0, 100)
    localStorage.setItem(WEBHOOK_LOGS_KEY, JSON.stringify(trimmed))
  } catch (err) {
    console.warn('Failed to log webhook event:', err)
  }
}

/**
 * Get webhook logs
 */
export function getWebhookLogs(webhookId = null) {
  try {
    const data = localStorage.getItem(WEBHOOK_LOGS_KEY)
    const logs = data ? JSON.parse(data) : []

    if (webhookId) {
      return logs.filter(l => l.webhookId === webhookId)
    }

    return logs
  } catch {
    return []
  }
}

/**
 * Clear webhook logs
 */
export function clearWebhookLogs(webhookId = null) {
  if (webhookId) {
    const logs = getWebhookLogs()
    const filtered = logs.filter(l => l.webhookId !== webhookId)
    localStorage.setItem(WEBHOOK_LOGS_KEY, JSON.stringify(filtered))
  } else {
    localStorage.removeItem(WEBHOOK_LOGS_KEY)
  }
}

/**
 * Test a webhook by sending a test event
 * @param {string} webhookId - Webhook ID
 * @returns {Promise<Object>} Test result
 */
export async function testWebhook(webhookId) {
  const webhook = getWebhookById(webhookId)

  if (!webhook) {
    return { success: false, error: 'Webhook not found' }
  }

  const testPayload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test event from ProofVault',
      webhookId: webhook.id,
      webhookName: webhook.name
    }
  }

  try {
    await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ProofVault-Event': 'test',
        'X-ProofVault-Webhook-Id': webhook.id
      },
      body: JSON.stringify(testPayload),
      mode: 'no-cors'
    })

    return { success: true, message: 'Test event sent successfully' }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Generate sample webhook payload for documentation
 */
export function getSamplePayload(event) {
  const samples = {
    [WEBHOOK_EVENTS.PROOF_CREATED]: {
      event: 'proof_created',
      timestamp: '2024-01-15T12:00:00.000Z',
      data: {
        proofId: 'PV-1705320000000-ABC123DEF',
        sha256Hash: 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
        cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        fileName: 'document.pdf',
        fileSize: 1048576,
        timestamp: '2024-01-15T12:00:00.000Z'
      }
    },
    [WEBHOOK_EVENTS.PROOF_VERIFIED]: {
      event: 'proof_verified',
      timestamp: '2024-01-15T12:05:00.000Z',
      data: {
        proofId: 'PV-1705320000000-ABC123DEF',
        verified: true,
        timestamp: '2024-01-15T12:05:00.000Z'
      }
    },
    [WEBHOOK_EVENTS.NFT_MINTED]: {
      event: 'nft_minted',
      timestamp: '2024-01-15T12:10:00.000Z',
      data: {
        proofId: 'PV-1705320000000-ABC123DEF',
        tokenId: '42',
        txHash: '0x1234567890abcdef...',
        timestamp: '2024-01-15T12:10:00.000Z'
      }
    }
  }

  return samples[event] || null
}
