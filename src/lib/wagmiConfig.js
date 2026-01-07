import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http, createConfig } from 'wagmi'
import { polygonAmoy, polygon, hardhat, filecoinCalibration, filecoin } from 'wagmi/chains'

// Custom simulated chain for testing without a wallet
export const simulatedChain = {
  id: 31338,
  name: 'Simulated (Demo)',
  nativeCurrency: {
    decimals: 18,
    name: 'Simulated ETH',
    symbol: 'SIM',
  },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
  },
  blockExplorers: {
    default: { name: 'Local', url: 'http://localhost:8545' },
  },
  testnet: true,
}

// Filecoin Calibration testnet config (if not available in wagmi)
export const filecoinCalibrationChain = {
  id: 314159,
  name: 'Filecoin Calibration',
  nativeCurrency: {
    decimals: 18,
    name: 'testnet FIL',
    symbol: 'tFIL',
  },
  rpcUrls: {
    default: { http: ['https://api.calibration.node.glif.io/rpc/v1'] },
    public: { http: ['https://api.calibration.node.glif.io/rpc/v1'] },
  },
  blockExplorers: {
    default: { name: 'Filfox', url: 'https://calibration.filfox.info' },
    filscan: { name: 'Filscan', url: 'https://calibration.filscan.io' },
  },
  testnet: true,
}

// Filecoin mainnet config (if not available in wagmi)
export const filecoinMainnetChain = {
  id: 314,
  name: 'Filecoin',
  nativeCurrency: {
    decimals: 18,
    name: 'FIL',
    symbol: 'FIL',
  },
  rpcUrls: {
    default: { http: ['https://api.node.glif.io/rpc/v1'] },
    public: { http: ['https://api.node.glif.io/rpc/v1'] },
  },
  blockExplorers: {
    default: { name: 'Filfox', url: 'https://filfox.info' },
    filscan: { name: 'Filscan', url: 'https://filscan.io' },
  },
  testnet: false,
}

// Available networks for UI
export const NETWORKS = {
  polygon: {
    id: polygon.id,
    name: 'Polygon',
    icon: 'polygon',
    testnet: false,
    category: 'L2'
  },
  polygonAmoy: {
    id: polygonAmoy.id,
    name: 'Polygon Amoy',
    icon: 'polygon',
    testnet: true,
    category: 'L2'
  },
  filecoinCalibration: {
    id: 314159,
    name: 'Filecoin Calibration',
    icon: 'filecoin',
    testnet: true,
    category: 'FVM'
  },
  filecoin: {
    id: 314,
    name: 'Filecoin',
    icon: 'filecoin',
    testnet: false,
    category: 'FVM'
  }
}

// RainbowKit config for real wallet connections
export const wagmiConfig = getDefaultConfig({
  appName: 'ProofVault',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [polygonAmoy, polygon, filecoinCalibrationChain, filecoinMainnetChain],
  transports: {
    [polygonAmoy.id]: http(),
    [polygon.id]: http(),
    [filecoinCalibrationChain.id]: http('https://api.calibration.node.glif.io/rpc/v1'),
    [filecoinMainnetChain.id]: http('https://api.node.glif.io/rpc/v1'),
  },
})

// Simulated blockchain state stored in memory/localStorage
const SIMULATED_STORAGE_KEY = 'proofvault_simulated_chain'

class SimulatedBlockchain {
  constructor() {
    this.blockNumber = 1
    this.timestamp = Math.floor(Date.now() / 1000)
    this.proofs = new Map()
    this.nfts = new Map()
    this.nftCounter = 1
    this.transactions = []
    this.load()
  }

  load() {
    if (typeof window === 'undefined') return
    try {
      const data = localStorage.getItem(SIMULATED_STORAGE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        this.blockNumber = parsed.blockNumber || 1
        this.proofs = new Map(parsed.proofs || [])
        this.nfts = new Map(parsed.nfts || [])
        this.nftCounter = parsed.nftCounter || 1
        this.transactions = parsed.transactions || []
      }
    } catch (err) {
      console.error('Failed to load simulated chain:', err)
    }
  }

  save() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(SIMULATED_STORAGE_KEY, JSON.stringify({
        blockNumber: this.blockNumber,
        proofs: Array.from(this.proofs.entries()),
        nfts: Array.from(this.nfts.entries()),
        nftCounter: this.nftCounter,
        transactions: this.transactions.slice(-100) // Keep last 100 txs
      }))
    } catch (err) {
      console.error('Failed to save simulated chain:', err)
    }
  }

  generateTxHash() {
    const chars = '0123456789abcdef'
    let hash = '0x'
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * 16)]
    }
    return hash
  }

  mineBlock() {
    this.blockNumber++
    this.timestamp = Math.floor(Date.now() / 1000)
    this.save()
  }

  // ProofRegistry simulation
  async registerProof(proofId, sha256Hash, cid) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000))

    if (this.proofs.has(proofId)) {
      throw new Error('Proof ID already exists')
    }

    const hashKey = sha256Hash.toLowerCase()
    for (const [, proof] of this.proofs) {
      if (proof.sha256Hash.toLowerCase() === hashKey) {
        throw new Error('Hash already registered')
      }
    }

    const proof = {
      proofId,
      sha256Hash,
      cid,
      registrant: '0xSimulated1234567890abcdef1234567890abcdef',
      timestamp: this.timestamp,
      blockNumber: this.blockNumber,
    }

    this.proofs.set(proofId, proof)
    const txHash = this.generateTxHash()

    this.transactions.push({
      hash: txHash,
      type: 'registerProof',
      proofId,
      blockNumber: this.blockNumber,
      timestamp: this.timestamp,
    })

    this.mineBlock()

    return {
      hash: txHash,
      blockNumber: this.blockNumber - 1,
      proof,
    }
  }

  getProof(proofId) {
    return this.proofs.get(proofId) || null
  }

  getProofByHash(sha256Hash) {
    const hashKey = sha256Hash.toLowerCase()
    for (const [, proof] of this.proofs) {
      if (proof.sha256Hash.toLowerCase() === hashKey) {
        return proof
      }
    }
    return null
  }

  proofExists(proofId) {
    return this.proofs.has(proofId)
  }

  // ProofNFT simulation
  async mintProof(proofId, sha256Hash, cid, fileName, fileSize) {
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000))

    if (this.nfts.has(proofId)) {
      throw new Error('Proof already minted')
    }

    const tokenId = this.nftCounter++
    const nft = {
      tokenId,
      proofId,
      sha256Hash,
      cid,
      fileName,
      fileSize,
      owner: '0xSimulated1234567890abcdef1234567890abcdef',
      timestamp: this.timestamp,
    }

    this.nfts.set(proofId, nft)
    const txHash = this.generateTxHash()

    this.transactions.push({
      hash: txHash,
      type: 'mintProof',
      proofId,
      tokenId,
      blockNumber: this.blockNumber,
      timestamp: this.timestamp,
    })

    this.mineBlock()

    return {
      hash: txHash,
      tokenId,
      blockNumber: this.blockNumber - 1,
    }
  }

  getNFT(proofId) {
    return this.nfts.get(proofId) || null
  }

  isProofMinted(proofId) {
    return this.nfts.has(proofId)
  }

  getTransaction(hash) {
    return this.transactions.find(tx => tx.hash === hash) || null
  }

  getTotalProofs() {
    return this.proofs.size
  }

  getTotalNFTs() {
    return this.nfts.size
  }
}

export const simulatedBlockchain = new SimulatedBlockchain()

// Check if we're in simulated mode
export function isSimulatedMode() {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('proofvault_blockchain_mode') !== 'real'
}

export function setBlockchainMode(mode) {
  if (typeof window === 'undefined') return
  localStorage.setItem('proofvault_blockchain_mode', mode)
}
