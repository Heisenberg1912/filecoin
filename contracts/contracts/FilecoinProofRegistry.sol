// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FilecoinProofRegistry
 * @notice Stores cryptographic proofs on Filecoin EVM with deal tracking
 * @dev Designed for deployment on Filecoin Calibration testnet and mainnet
 */
contract FilecoinProofRegistry is Ownable, ReentrancyGuard {

    struct Proof {
        bytes32 sha256Hash;      // SHA-256 hash of the file
        string cid;              // IPFS Content Identifier
        string proofId;          // Unique proof identifier
        address registrant;      // Address that registered the proof
        uint256 timestamp;       // Block timestamp when registered
        uint256 blockNumber;     // Block number when registered
        uint64[] dealIds;        // Filecoin storage deal IDs (if tracked)
        string storageProvider;  // Storage provider info
    }

    struct DealInfo {
        uint64 dealId;
        string provider;
        uint256 startEpoch;
        uint256 endEpoch;
        bool active;
    }

    // Mapping from proofId to Proof
    mapping(string => Proof) public proofs;

    // Mapping from sha256Hash to proofId
    mapping(bytes32 => string) public hashToProofId;

    // Mapping from CID to proofId
    mapping(string => string) public cidToProofId;

    // Mapping from proofId to deal info array
    mapping(string => DealInfo[]) public proofDeals;

    // Total number of proofs registered
    uint256 public totalProofs;

    // Total number of deals tracked
    uint256 public totalDealsTracked;

    // Events
    event ProofRegistered(
        string indexed proofId,
        bytes32 indexed sha256Hash,
        string cid,
        address indexed registrant,
        uint256 timestamp,
        uint256 blockNumber
    );

    event DealLinked(
        string indexed proofId,
        uint64 dealId,
        string provider
    );

    event DealStatusUpdated(
        string indexed proofId,
        uint64 dealId,
        bool active
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new proof on Filecoin EVM
     * @param proofId Unique identifier for the proof
     * @param sha256Hash SHA-256 hash of the file (as bytes32)
     * @param cid IPFS Content Identifier
     * @param storageProvider Optional storage provider info
     */
    function registerProof(
        string calldata proofId,
        bytes32 sha256Hash,
        string calldata cid,
        string calldata storageProvider
    ) external nonReentrant {
        require(bytes(proofId).length > 0, "Invalid proof ID");
        require(sha256Hash != bytes32(0), "Invalid hash");
        require(bytes(cid).length > 0, "Invalid CID");
        require(proofs[proofId].timestamp == 0, "Proof ID already exists");
        require(bytes(hashToProofId[sha256Hash]).length == 0, "Hash already registered");

        uint64[] memory emptyDeals;

        Proof memory newProof = Proof({
            sha256Hash: sha256Hash,
            cid: cid,
            proofId: proofId,
            registrant: msg.sender,
            timestamp: block.timestamp,
            blockNumber: block.number,
            dealIds: emptyDeals,
            storageProvider: storageProvider
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
     * @notice Link a Filecoin storage deal to a proof
     * @param proofId The proof identifier
     * @param dealId The Filecoin deal ID
     * @param provider The storage provider address/ID
     * @param startEpoch Deal start epoch
     * @param endEpoch Deal end epoch
     */
    function linkDeal(
        string calldata proofId,
        uint64 dealId,
        string calldata provider,
        uint256 startEpoch,
        uint256 endEpoch
    ) external {
        require(proofs[proofId].timestamp > 0, "Proof not found");
        require(
            proofs[proofId].registrant == msg.sender || owner() == msg.sender,
            "Not authorized"
        );

        DealInfo memory deal = DealInfo({
            dealId: dealId,
            provider: provider,
            startEpoch: startEpoch,
            endEpoch: endEpoch,
            active: true
        });

        proofDeals[proofId].push(deal);
        proofs[proofId].dealIds.push(dealId);
        totalDealsTracked++;

        emit DealLinked(proofId, dealId, provider);
    }

    /**
     * @notice Update deal status
     * @param proofId The proof identifier
     * @param dealIndex Index of the deal in the proof's deal array
     * @param active Whether the deal is active
     */
    function updateDealStatus(
        string calldata proofId,
        uint256 dealIndex,
        bool active
    ) external {
        require(proofs[proofId].timestamp > 0, "Proof not found");
        require(dealIndex < proofDeals[proofId].length, "Invalid deal index");
        require(
            proofs[proofId].registrant == msg.sender || owner() == msg.sender,
            "Not authorized"
        );

        proofDeals[proofId][dealIndex].active = active;

        emit DealStatusUpdated(
            proofId,
            proofDeals[proofId][dealIndex].dealId,
            active
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
     * @notice Get all deals for a proof
     * @param proofId The proof identifier
     * @return Array of DealInfo
     */
    function getProofDeals(string calldata proofId) external view returns (DealInfo[] memory) {
        return proofDeals[proofId];
    }

    /**
     * @notice Get count of active deals for a proof
     * @param proofId The proof identifier
     * @return Count of active deals
     */
    function getActiveDealsCount(string calldata proofId) external view returns (uint256) {
        uint256 count = 0;
        DealInfo[] memory deals = proofDeals[proofId];
        for (uint256 i = 0; i < deals.length; i++) {
            if (deals[i].active) {
                count++;
            }
        }
        return count;
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

    /**
     * @notice Get registry statistics
     * @return _totalProofs Total proofs registered
     * @return _totalDeals Total deals tracked
     */
    function getStats() external view returns (uint256 _totalProofs, uint256 _totalDeals) {
        return (totalProofs, totalDealsTracked);
    }
}
