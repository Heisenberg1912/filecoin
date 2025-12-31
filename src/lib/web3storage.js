import * as Client from '@web3-storage/w3up-client'

let client = null
let isDemo = true // Default to demo mode

// Initialize the Web3.Storage client
export async function getClient() {
  if (client) return client
  try {
    client = await Client.create()
    return client
  } catch (err) {
    console.error('Failed to create Web3.Storage client:', err)
    isDemo = true
    return null
  }
}

// Check if user has a registered space
export async function isRegistered() {
  try {
    const c = await getClient()
    if (!c) return false
    const spaces = c.spaces()
    if (spaces.length > 0) {
      const current = c.currentSpace()
      if (!current && spaces.length > 0) {
        await c.setCurrentSpace(spaces[0].did())
      }
      return true
    }
    return false
  } catch (err) {
    console.error('isRegistered error:', err)
    return false
  }
}

// Check if running in demo mode
export function isDemoMode() {
  return isDemo
}

// Set demo mode
export function setDemoMode(value) {
  isDemo = value
}

// Generate a mock CID for demo mode
function generateMockCID() {
  const chars = 'abcdefghijklmnopqrstuvwxyz234567'
  let cid = 'bafybeig'
  for (let i = 0; i < 52; i++) {
    cid += chars[Math.floor(Math.random() * chars.length)]
  }
  return cid
}

// Register with email
export async function registerWithEmail(email) {
  const c = await getClient()
  if (!c) {
    throw new Error('Web3.Storage client not available')
  }

  try {
    const account = await c.login(email)

    try {
      await account.plan.wait()
    } catch (planError) {
      console.warn('Plan wait error:', planError)
    }

    const existingSpaces = c.spaces()
    if (existingSpaces.length > 0) {
      await c.setCurrentSpace(existingSpaces[0].did())
      return existingSpaces[0]
    }

    const spaceName = `proofvault-${Date.now()}`
    const space = await c.createSpace(spaceName)

    try {
      await account.provision(space.did())
    } catch (provisionError) {
      console.warn('Provision error:', provisionError)
    }

    await space.save()
    await c.setCurrentSpace(space.did())

    return space
  } catch (err) {
    console.error('Registration error:', err)

    if (err.message?.includes('payment') || err.message?.includes('plan')) {
      throw new Error('Please visit console.web3.storage to set up your free account first.')
    }

    throw new Error(err.message || 'Registration failed.')
  }
}

// Upload a file to IPFS/Filecoin
export async function uploadFile(file) {
  if (isDemo) {
    await new Promise(r => setTimeout(r, 1000))
    return generateMockCID()
  }

  const c = await getClient()
  if (!c) {
    throw new Error('Web3.Storage client not available')
  }

  const space = c.currentSpace()
  if (!space) {
    throw new Error('No space configured. Please register first.')
  }

  try {
    const cid = await c.uploadFile(file)
    return cid.toString()
  } catch (err) {
    console.error('Upload error:', err)

    const errMsg = err.message || ''
    if (errMsg.includes('space/blob/add') || errMsg.includes('invocation')) {
      isDemo = true
      throw new Error('Upload failed. Switching to demo mode - please try again.')
    }

    throw new Error(err.message || 'Failed to upload file')
  }
}

// Get gateway URL for a CID
export function getGatewayUrl(cid) {
  return `https://w3s.link/ipfs/${cid}`
}

// Get explorer URL for a CID
export function getExplorerUrl(cid) {
  return `https://filfox.info/en/deal/${cid}`
}
