// ProofRegistry ABI
export const ProofRegistryABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "proofId", type: "string" },
      { indexed: true, internalType: "bytes32", name: "sha256Hash", type: "bytes32" },
      { indexed: false, internalType: "string", name: "cid", type: "string" },
      { indexed: true, internalType: "address", name: "registrant", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "blockNumber", type: "uint256" }
    ],
    name: "ProofRegistered",
    type: "event"
  },
  {
    inputs: [{ internalType: "string", name: "proofId", type: "string" }],
    name: "getProof",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "sha256Hash", type: "bytes32" },
          { internalType: "string", name: "cid", type: "string" },
          { internalType: "string", name: "proofId", type: "string" },
          { internalType: "address", name: "registrant", type: "address" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "uint256", name: "blockNumber", type: "uint256" }
        ],
        internalType: "struct ProofRegistry.Proof",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "sha256Hash", type: "bytes32" }],
    name: "getProofByHash",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "sha256Hash", type: "bytes32" },
          { internalType: "string", name: "cid", type: "string" },
          { internalType: "string", name: "proofId", type: "string" },
          { internalType: "address", name: "registrant", type: "address" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "uint256", name: "blockNumber", type: "uint256" }
        ],
        internalType: "struct ProofRegistry.Proof",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "sha256Hash", type: "bytes32" }],
    name: "hashExists",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "proofId", type: "string" }],
    name: "proofExists",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "proofId", type: "string" },
      { internalType: "bytes32", name: "sha256Hash", type: "bytes32" },
      { internalType: "string", name: "cid", type: "string" }
    ],
    name: "registerProof",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "totalProofs",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "proofId", type: "string" },
      { internalType: "bytes32", name: "sha256Hash", type: "bytes32" }
    ],
    name: "verifyProof",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
]

// ProofNFT ABI
export const ProofNFTABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: true, internalType: "string", name: "proofId", type: "string" },
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: false, internalType: "string", name: "cid", type: "string" }
    ],
    name: "ProofNFTMinted",
    type: "event"
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getProofData",
    outputs: [
      {
        components: [
          { internalType: "string", name: "proofId", type: "string" },
          { internalType: "bytes32", name: "sha256Hash", type: "bytes32" },
          { internalType: "string", name: "cid", type: "string" },
          { internalType: "string", name: "fileName", type: "string" },
          { internalType: "uint256", name: "fileSize", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "address", name: "registrant", type: "address" }
        ],
        internalType: "struct ProofNFT.ProofData",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "proofId", type: "string" }],
    name: "getTokenIdByProofId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "proofId", type: "string" }],
    name: "isProofMinted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "proofId", type: "string" },
      { internalType: "bytes32", name: "sha256Hash", type: "bytes32" },
      { internalType: "string", name: "cid", type: "string" },
      { internalType: "string", name: "fileName", type: "string" },
      { internalType: "uint256", name: "fileSize", type: "uint256" }
    ],
    name: "mintProof",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  }
]
