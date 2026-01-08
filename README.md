# ProofVault

**Decentralized file certification and timestamping using IPFS and Filecoin**

ProofVault lets you upload a file and generate a verifiable proof showing what the file was and when it existed. The proof is derived from a cryptographic hash and backed by content-addressed storage, making it suitable for verification, auditing, and long-term reference.

![ProofVault](https://img.shields.io/badge/Filecoin-Powered-00d4aa)
![License](https://img.shields.io/badge/License-MIT%20%26%20Apache%202.0-blue)

## What it does

- Computes a SHA-256 hash of a file locally
- Uploads the file to IPFS / Filecoin storage
- Generates a proof certificate containing:
- File hash & Content ID (CID)
- Timestamp
- Reference links for verification
- Allows the proof certificate to be downloaded as JSON

## Features

- **Cryptographic Proof**: SHA-256 hash of your file stored immutably
- **IPFS Storage**: Content addressed storage via CID
- **Filecoin Deals**: Long-term storage with cryptographic proofs
- **Downloadable Certificates**: JSON proof certificates for verification
- **Beautiful UI**: Modern, responsive design

## Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd proofvault

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment on Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

### Option 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel deploy --prod
```

## Environment Variables

For production use with real Filecoin storage providers, the following environment variables are required:

```env
# Storacha/Web3.Storage credentials (optional for demo)
NEXT_PUBLIC_W3UP_EMAIL=your-email@example.com
W3UP_PROOF=your-delegation-proof
```

## How It Works

1. **Upload**: User drops or selects a file
2. **Hash**: File is hashed locally using SHA-256
3. **Store**: File is uploaded to IPFS/Filecoin (demo uses simulated CIDs)
4. **Certify**: Proof certificate is generated with:
   - File hash (SHA-256)
   - Content ID (CID)
   - Unix timestamp
   - Gateway & explorer links

## Filecoin Grant Opportunity

This project aligns with Filecoin Foundation's grant priorities:
| Category | Alignment |
|----------|-----------|
| **Storage** | Drives real data onboarding to Filecoin |
| **Developer Tooling** | SDK/API for proof generation |
| **FVM Integration** | Smart contracts for on-chain verification |
| **User Adoption** | Solves real problems for creators & businesses |


### Grant Programs
- **FIL Builder Next Step Grants**: $5K-$10K (Applications open through April 30, 2025)
- **Open Grants**: Up to $50K
- **ProPGF Batch 2**: Larger funding (Applications until December 23, 2025)

Apply at: https://fil.org/grants

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: CSS Modules
- **Storage**: Web3.Storage / Storacha
- **Hashing**: Web Crypto API

## License

Dual licensed under MIT and Apache 2.0 (as required by Filecoin grants).

## Contributing

Contributions welcome! Please read our contributing guidelines first.

---

Built for the Filecoin ecosystem 🌐
