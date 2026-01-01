# ProofVault 🔐

**Decentralized File Certification & Timestamping on Filecoin**

Upload any file to get a cryptographic proof certificate with timestamps stored permanently on the Filecoin network. Prove what you created and when.

![ProofVault](https://img.shields.io/badge/Filecoin-Powered-00d4aa)
![License](https://img.shields.io/badge/License-MIT%20%26%20Apache%202.0-blue)

## 🌟 Features

- **Cryptographic Proof**: SHA-256 hash of your file stored immutably
- **IPFS Storage**: Content addressed storage via CID
- **Filecoin Deals**: Long-term storage with cryptographic proofs
- **Downloadable Certificates**: JSON proof certificates for verification
- **Beautiful UI**: Modern, responsive design

## 🚀 Quick Start

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

## 📦 Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

### Option 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel deploy --prod
```


## 🎯 How It Works

1. **Upload**: User drops or selects a file
2. **Hash**: File is hashed locally using SHA-256
3. **Store**: File is uploaded to IPFS/Filecoin (demo uses simulated CIDs)
4. **Certify**: Proof certificate is generated with:
   - File hash (SHA-256)
   - Content ID (CID)
   - Unix timestamp
   - Gateway & explorer links



## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: CSS Modules
- **Storage**: Web3.Storage / Storacha
- **Hashing**: Web Crypto API


## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

---

Built for the Filecoin ecosystem 🌐
