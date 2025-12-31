// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProofRegistry
 * @notice Stores cryptographic proofs on-chain for file certification
 * @dev Free to use - users only pay gas fees
 */
contract ProofRegistry is Ownable, ReentrancyGuard {

    struct Proof {
        bytes32 sha256Hash;      // SHA-256 hash of the file
        string cid;              // IPFS Content Identifier
        string proofId;          // Unique proof identifier (e.g., PV-1234567890-ABC123)
        address registrant;      // Address that registered the proof
        uint256 timestamp;       // Block timestamp when registered
        uint256 blockNumber;     // Block number when registered
    }

    // Mapping from proofId to Proof
    mapping(string => Proof) public proofs;

    // Mapping from sha256Hash to proofId (for lookup by hash)
    mapping(bytes32 => string) public hashToProofId;

    // Mapping from CID to proofId (for lookup by CID)
    mapping(string => string) public cidToProofId;

    // Total number of proofs registered
    uint256 public totalProofs;

    // Events for indexing and tracking
    event ProofRegistered(
        string indexed proofId,
        bytes32 indexed sha256Hash,
        string cid,
        address indexed registrant,
        uint256 timestamp,
        uint256 blockNumber
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new proof on-chain
     * @param proofId Unique identifier for the proof
     * @param sha256Hash SHA-256 hash of the file (as bytes32)
     * @param cid IPFS Content Identifier
     */
    function registerProof(
        string calldata proofId,
        bytes32 sha256Hash,
        string calldata cid
    ) external nonReentrant {
        require(bytes(proofId).length > 0, "Invalid proof ID");
        require(sha256Hash != bytes32(0), "Invalid hash");
        require(bytes(cid).length > 0, "Invalid CID");
        require(proofs[proofId].timestamp == 0, "Proof ID already exists");
        require(bytes(hashToProofId[sha256Hash]).length == 0, "Hash already registered");

        Proof memory newProof = Proof({
            sha256Hash: sha256Hash,
            cid: cid,
            proofId: proofId,
            registrant: msg.sender,
            timestamp: block.timestamp,
            blockNumber: block.number
        });

        proofs[proofId] = newProof;
        hashToProofId[sha256Hash] = proofId;
        cidToProofId[cid] = proofId;
        totalProofs++;

        emit ProofRegistered(
            proofId,
            sha256Hash,
            cid,
            msg.sender,
            block.timestamp,
            block.number
        );
    }

    /**
     * @notice Get a proof by its ID
     * @param proofId The unique proof identifier
     * @return The Proof struct
     */
    function getProof(string calldata proofId) external view returns (Proof memory) {
        require(proofs[proofId].timestamp > 0, "Proof not found");
        return proofs[proofId];
    }

    /**
     * @notice Get a proof by its SHA-256 hash
     * @param sha256Hash The file hash
     * @return The Proof struct
     */
    function getProofByHash(bytes32 sha256Hash) external view returns (Proof memory) {
        string memory proofId = hashToProofId[sha256Hash];
        require(bytes(proofId).length > 0, "Proof not found");
        return proofs[proofId];
    }

    /**
     * @notice Get a proof by its IPFS CID
     * @param cid The Content Identifier
     * @return The Proof struct
     */
    function getProofByCid(string calldata cid) external view returns (Proof memory) {
        string memory proofId = cidToProofId[cid];
        require(bytes(proofId).length > 0, "Proof not found");
        return proofs[proofId];
    }

    /**
     * @notice Verify if a proof exists and matches the given hash
     * @param proofId The proof identifier to verify
     * @param sha256Hash The expected file hash
     * @return True if the proof exists and hash matches
     */
    function verifyProof(string calldata proofId, bytes32 sha256Hash) external view returns (bool) {
        Proof memory proof = proofs[proofId];
        return proof.timestamp > 0 && proof.sha256Hash == sha256Hash;
    }

    /**
     * @notice Check if a proof ID is already registered
     * @param proofId The proof identifier to check
     * @return True if the proof exists
     */
    function proofExists(string calldata proofId) external view returns (bool) {
        return proofs[proofId].timestamp > 0;
    }

    /**
     * @notice Check if a hash is already registered
     * @param sha256Hash The hash to check
     * @return True if the hash is registered
     */
    function hashExists(bytes32 sha256Hash) external view returns (bool) {
        return bytes(hashToProofId[sha256Hash]).length > 0;
    }
}
