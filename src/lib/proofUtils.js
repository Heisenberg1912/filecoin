import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'

// Generate QR code as data URL
export async function generateQRCode(data, options = {}) {
  const defaultOptions = {
    width: 200,
    margin: 2,
    color: {
      dark: '#00ff88',
      light: '#0a0a0f'
    }
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(
      typeof data === 'string' ? data : JSON.stringify(data),
      { ...defaultOptions, ...options }
    )
    return qrDataUrl
  } catch (err) {
    console.error('QR generation failed:', err)
    return null
  }
}

// Generate PDF certificate
export async function generatePDFCertificate(proof) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Dark background
  pdf.setFillColor(10, 10, 15)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')

  // Header gradient bar
  pdf.setFillColor(0, 255, 136)
  pdf.rect(0, 0, pageWidth, 3, 'F')

  // Title
  pdf.setTextColor(0, 255, 136)
  pdf.setFontSize(28)
  pdf.setFont('helvetica', 'bold')
  pdf.text('PROOF CERTIFICATE', pageWidth / 2, 30, { align: 'center' })

  // Subtitle
  pdf.setTextColor(180, 180, 180)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Cryptographic Proof of File Existence', pageWidth / 2, 40, { align: 'center' })

  // Proof ID Badge
  pdf.setFillColor(0, 255, 136, 0.1)
  pdf.roundedRect(pageWidth / 2 - 35, 48, 70, 10, 5, 5, 'F')
  pdf.setTextColor(0, 255, 136)
  pdf.setFontSize(10)
  pdf.text(proof.proofId, pageWidth / 2, 55, { align: 'center' })

  // Divider
  pdf.setDrawColor(50, 50, 60)
  pdf.setLineWidth(0.3)
  pdf.line(20, 65, pageWidth - 20, 65)

  // File Information Section
  let yPos = 80

  pdf.setTextColor(100, 100, 110)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('FILE INFORMATION', 20, yPos)
  yPos += 10

  // File details
  const details = [
    ['File Name', proof.fileName],
    ['File Size', formatFileSize(proof.fileSize)],
    ['File Type', proof.fileType || 'Unknown'],
    ['Timestamp', proof.timestampReadable],
    ['Unix Timestamp', proof.unixTimestamp?.toString()]
  ]

  pdf.setFont('helvetica', 'normal')
  details.forEach(([label, value]) => {
    pdf.setTextColor(120, 120, 130)
    pdf.setFontSize(9)
    pdf.text(label, 20, yPos)
    pdf.setTextColor(230, 230, 230)
    pdf.setFontSize(10)
    pdf.text(value || 'N/A', 70, yPos)
    yPos += 8
  })

  yPos += 10

  // Cryptographic Proof Section
  pdf.setTextColor(100, 100, 110)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CRYPTOGRAPHIC PROOF', 20, yPos)
  yPos += 10

  // SHA-256 Hash
  pdf.setTextColor(120, 120, 130)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text('SHA-256 Hash', 20, yPos)
  yPos += 6

  pdf.setFillColor(20, 20, 30)
  pdf.roundedRect(20, yPos - 3, pageWidth - 40, 12, 2, 2, 'F')
  pdf.setTextColor(0, 255, 136)
  pdf.setFontSize(7)
  pdf.setFont('courier', 'normal')
  pdf.text(proof.sha256Hash, 25, yPos + 4)
  yPos += 18

  // IPFS CID
  pdf.setTextColor(120, 120, 130)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text('IPFS Content Identifier (CID)', 20, yPos)
  yPos += 6

  pdf.setFillColor(20, 20, 30)
  pdf.roundedRect(20, yPos - 3, pageWidth - 40, 12, 2, 2, 'F')
  pdf.setTextColor(136, 136, 255)
  pdf.setFontSize(7)
  pdf.setFont('courier', 'normal')
  pdf.text(proof.cid, 25, yPos + 4)
  yPos += 25

  // Verification Links Section
  pdf.setTextColor(100, 100, 110)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('VERIFICATION LINKS', 20, yPos)
  yPos += 10

  pdf.setTextColor(120, 120, 130)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text('IPFS Gateway:', 20, yPos)
  pdf.setTextColor(100, 149, 237)
  pdf.textWithLink(proof.gatewayUrl, 55, yPos, { url: proof.gatewayUrl })
  yPos += 8

  pdf.setTextColor(120, 120, 130)
  pdf.text('Filecoin Explorer:', 20, yPos)
  pdf.setTextColor(100, 149, 237)
  pdf.textWithLink(proof.explorerUrl, 55, yPos, { url: proof.explorerUrl })
  yPos += 20

  // On-Chain Status
  if (proof.onChain?.registered) {
    pdf.setTextColor(100, 100, 110)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text('BLOCKCHAIN REGISTRATION', 20, yPos)
    yPos += 10

    pdf.setFillColor(0, 255, 136, 0.1)
    pdf.roundedRect(20, yPos - 3, pageWidth - 40, 20, 2, 2, 'F')

    pdf.setTextColor(0, 255, 136)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Status: Registered on Polygon', 25, yPos + 4)
    pdf.setTextColor(180, 180, 180)
    pdf.setFontSize(7)
    pdf.text(`TX: ${proof.onChain.txHash}`, 25, yPos + 12)
    yPos += 30
  }

  // NFT Status
  if (proof.nft?.minted) {
    pdf.setTextColor(100, 100, 110)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text('NFT CERTIFICATE', 20, yPos)
    yPos += 10

    pdf.setFillColor(168, 85, 247, 0.1)
    pdf.roundedRect(20, yPos - 3, pageWidth - 40, 15, 2, 2, 'F')

    pdf.setTextColor(168, 85, 247)
    pdf.setFontSize(8)
    pdf.text(`Token ID: ${proof.nft.tokenId}`, 25, yPos + 5)
    yPos += 25
  }

  // QR Code
  try {
    const qrData = await generateQRCode(JSON.stringify({
      proofId: proof.proofId,
      hash: proof.sha256Hash,
      cid: proof.cid
    }), { width: 100, color: { dark: '#ffffff', light: '#0a0a0f' } })

    if (qrData) {
      pdf.addImage(qrData, 'PNG', pageWidth - 50, pageHeight - 60, 35, 35)
      pdf.setTextColor(100, 100, 110)
      pdf.setFontSize(7)
      pdf.text('Scan to Verify', pageWidth - 32, pageHeight - 22, { align: 'center' })
    }
  } catch (e) {
    console.log('QR code generation skipped')
  }

  // Footer
  pdf.setDrawColor(50, 50, 60)
  pdf.setLineWidth(0.3)
  pdf.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15)

  pdf.setTextColor(100, 100, 110)
  pdf.setFontSize(8)
  pdf.text('ProofVault - Decentralized File Certification', 20, pageHeight - 8)
  pdf.text('Powered by Filecoin & IPFS', pageWidth - 20, pageHeight - 8, { align: 'right' })

  // Demo watermark
  if (proof.demoMode) {
    pdf.setTextColor(255, 200, 50, 0.3)
    pdf.setFontSize(60)
    pdf.setFont('helvetica', 'bold')
    pdf.text('DEMO', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
      opacity: 0.1
    })
  }

  return pdf
}

// Download PDF
export async function downloadPDFCertificate(proof) {
  const pdf = await generatePDFCertificate(proof)
  pdf.save(`ProofVault-Certificate-${proof.proofId}.pdf`)
}

// Generate shareable verification URL
export function generateShareableURL(proof) {
  const baseUrl = window.location.origin
  const params = new URLSearchParams({
    id: proof.proofId,
    hash: proof.sha256Hash.substring(0, 16),
    cid: proof.cid.substring(0, 20)
  })
  return `${baseUrl}/verify?${params.toString()}`
}

// Generate Twitter share URL
export function generateTwitterShareURL(proof) {
  const text = `I just certified a file on ProofVault!\n\nFile: ${proof.fileName}\nProof ID: ${proof.proofId}\n\nStored permanently on @Filecoin via @IPFS\n\n#Web3 #Filecoin #ProofVault`
  const url = generateShareableURL(proof)
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

// Format file size helper
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get proof statistics from localStorage
export function getProofStatistics(proofs) {
  if (!proofs || proofs.length === 0) {
    return {
      totalProofs: 0,
      totalSize: 0,
      onChainCount: 0,
      nftCount: 0,
      demoCount: 0,
      realCount: 0,
      fileTypes: {},
      byDate: {}
    }
  }

  const stats = {
    totalProofs: proofs.length,
    totalSize: 0,
    onChainCount: 0,
    nftCount: 0,
    demoCount: 0,
    realCount: 0,
    fileTypes: {},
    byDate: {}
  }

  proofs.forEach(proof => {
    stats.totalSize += proof.fileSize || 0
    if (proof.onChain?.registered) stats.onChainCount++
    if (proof.nft?.minted) stats.nftCount++
    if (proof.demoMode) stats.demoCount++
    else stats.realCount++

    // File types
    const ext = proof.fileName?.split('.').pop()?.toLowerCase() || 'unknown'
    stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1

    // By date
    const date = new Date(proof.timestamp).toLocaleDateString()
    stats.byDate[date] = (stats.byDate[date] || 0) + 1
  })

  return stats
}

// Compare two proofs
export function compareProofs(proof1, proof2) {
  const comparison = {
    sameFile: proof1.sha256Hash === proof2.sha256Hash,
    sameCID: proof1.cid === proof2.cid,
    sameFileName: proof1.fileName === proof2.fileName,
    sameSize: proof1.fileSize === proof2.fileSize,
    timeDifference: null,
    proof1Older: null
  }

  if (proof1.unixTimestamp && proof2.unixTimestamp) {
    comparison.timeDifference = Math.abs(proof1.unixTimestamp - proof2.unixTimestamp)
    comparison.proof1Older = proof1.unixTimestamp < proof2.unixTimestamp
  }

  return comparison
}

// Collection management
const COLLECTIONS_KEY = 'proofvault_collections'

export function getCollections() {
  try {
    const data = localStorage.getItem(COLLECTIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveCollection(collection) {
  try {
    const collections = getCollections()
    const existingIndex = collections.findIndex(c => c.id === collection.id)
    if (existingIndex >= 0) {
      collections[existingIndex] = collection
    } else {
      collections.unshift(collection)
    }
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections))
    return true
  } catch {
    return false
  }
}

export function deleteCollection(collectionId) {
  try {
    const collections = getCollections()
    const filtered = collections.filter(c => c.id !== collectionId)
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(filtered))
    return true
  } catch {
    return false
  }
}

export function createCollection(name, description = '') {
  return {
    id: `COL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    name,
    description,
    proofIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export function addProofToCollection(collectionId, proofId) {
  const collections = getCollections()
  const collection = collections.find(c => c.id === collectionId)
  if (collection && !collection.proofIds.includes(proofId)) {
    collection.proofIds.push(proofId)
    collection.updatedAt = new Date().toISOString()
    saveCollection(collection)
    return true
  }
  return false
}

export function removeProofFromCollection(collectionId, proofId) {
  const collections = getCollections()
  const collection = collections.find(c => c.id === collectionId)
  if (collection) {
    collection.proofIds = collection.proofIds.filter(id => id !== proofId)
    collection.updatedAt = new Date().toISOString()
    saveCollection(collection)
    return true
  }
  return false
}
