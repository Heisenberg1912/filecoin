// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title ProofNFT
 * @notice Mint NFTs as certificates of proof for registered files
 * @dev Each NFT represents a unique proof certificate
 */
contract ProofNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Strings for uint256;

    struct ProofData {
        string proofId;
        bytes32 sha256Hash;
        string cid;
        string fileName;
        uint256 fileSize;
        uint256 timestamp;
        address registrant;
    }

    // Token ID counter
    uint256 private _tokenIdCounter;

    // Mapping from proofId to tokenId
    mapping(string => uint256) public proofIdToTokenId;

    // Mapping from tokenId to ProofData
    mapping(uint256 => ProofData) public tokenProofData;

    // Events
    event ProofNFTMinted(
        uint256 indexed tokenId,
        string indexed proofId,
        address indexed owner,
        string cid
    );

    constructor() ERC721("ProofVault Certificate", "PROOF") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start from 1
    }

    /**
     * @notice Mint a new proof NFT
     * @param proofId Unique proof identifier
     * @param sha256Hash SHA-256 hash of the file
     * @param cid IPFS Content Identifier
     * @param fileName Name of the file
     * @param fileSize Size of the file in bytes
     */
    function mintProof(
        string calldata proofId,
        bytes32 sha256Hash,
        string calldata cid,
        string calldata fileName,
        uint256 fileSize
    ) external nonReentrant returns (uint256) {
        require(bytes(proofId).length > 0, "Invalid proof ID");
        require(sha256Hash != bytes32(0), "Invalid hash");
        require(bytes(cid).length > 0, "Invalid CID");
        require(proofIdToTokenId[proofId] == 0, "Proof already minted");

        uint256 tokenId = _tokenIdCounter++;

        ProofData memory data = ProofData({
            proofId: proofId,
            sha256Hash: sha256Hash,
            cid: cid,
            fileName: fileName,
            fileSize: fileSize,
            timestamp: block.timestamp,
            registrant: msg.sender
        });

        tokenProofData[tokenId] = data;
        proofIdToTokenId[proofId] = tokenId;

        _safeMint(msg.sender, tokenId);

        emit ProofNFTMinted(tokenId, proofId, msg.sender, cid);

        return tokenId;
    }

    /**
     * @notice Get the token ID for a proof
     * @param proofId The proof identifier
     * @return The token ID (0 if not minted)
     */
    function getTokenIdByProofId(string calldata proofId) external view returns (uint256) {
        return proofIdToTokenId[proofId];
    }

    /**
     * @notice Get proof data for a token
     * @param tokenId The token ID
     * @return The ProofData struct
     */
    function getProofData(uint256 tokenId) external view returns (ProofData memory) {
        require(tokenId > 0 && tokenId < _tokenIdCounter, "Invalid token ID");
        return tokenProofData[tokenId];
    }

    /**
     * @notice Check if a proof has been minted
     * @param proofId The proof identifier
     * @return True if minted
     */
    function isProofMinted(string calldata proofId) external view returns (bool) {
        return proofIdToTokenId[proofId] != 0;
    }

    /**
     * @notice Get total supply of minted NFTs
     * @return Total number of minted tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @notice Generate on-chain SVG for the NFT
     */
    function _generateSVG(ProofData memory data) internal pure returns (string memory) {
        string memory hashStr = _bytes32ToHexString(data.sha256Hash);
        string memory shortHash = string(abi.encodePacked(
            _substring(hashStr, 0, 8),
            "...",
            _substring(hashStr, 56, 64)
        ));

        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">',
            '<defs>',
            '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#0a0a0a"/>',
            '<stop offset="100%" style="stop-color:#1a1a2e"/>',
            '</linearGradient>',
            '<linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">',
            '<stop offset="0%" style="stop-color:#00ff88"/>',
            '<stop offset="100%" style="stop-color:#00cc6a"/>',
            '</linearGradient>',
            '</defs>',
            '<rect width="400" height="500" fill="url(#bg)" rx="20"/>',
            '<rect x="20" y="20" width="360" height="460" fill="none" stroke="url(#accent)" stroke-width="2" rx="15" opacity="0.5"/>',
            _generateSVGContent(data, shortHash),
            '</svg>'
        ));
    }

    function _generateSVGContent(ProofData memory data, string memory shortHash) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<text x="200" y="60" text-anchor="middle" fill="url(#accent)" font-family="monospace" font-size="24" font-weight="bold">PROOFVAULT</text>',
            '<text x="200" y="85" text-anchor="middle" fill="#666" font-family="sans-serif" font-size="12">CERTIFICATE OF PROOF</text>',
            '<line x1="50" y1="110" x2="350" y2="110" stroke="#333" stroke-width="1"/>',
            '<text x="50" y="150" fill="#888" font-family="sans-serif" font-size="11">PROOF ID</text>',
            '<text x="50" y="175" fill="#fff" font-family="monospace" font-size="14">', data.proofId, '</text>',
            '<text x="50" y="220" fill="#888" font-family="sans-serif" font-size="11">FILE</text>',
            '<text x="50" y="245" fill="#fff" font-family="sans-serif" font-size="14">', _truncateString(data.fileName, 30), '</text>',
            '<text x="50" y="290" fill="#888" font-family="sans-serif" font-size="11">SHA-256 HASH</text>',
            '<text x="50" y="315" fill="url(#accent)" font-family="monospace" font-size="12">', shortHash, '</text>',
            '<text x="50" y="360" fill="#888" font-family="sans-serif" font-size="11">IPFS CID</text>',
            '<text x="50" y="385" fill="#aaa" font-family="monospace" font-size="10">', _truncateString(data.cid, 40), '</text>',
            '<line x1="50" y1="420" x2="350" y2="420" stroke="#333" stroke-width="1"/>',
            '<text x="200" y="460" text-anchor="middle" fill="#444" font-family="sans-serif" font-size="10">Immutable proof on Filecoin + Polygon</text>'
        ));
    }

    /**
     * @notice Generate token URI with on-chain metadata
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(tokenId > 0 && tokenId < _tokenIdCounter, "Invalid token ID");

        ProofData memory data = tokenProofData[tokenId];
        string memory svg = _generateSVG(data);
        string memory svgBase64 = Base64.encode(bytes(svg));

        string memory json = string(abi.encodePacked(
            '{"name":"ProofVault Certificate #', tokenId.toString(),
            '","description":"Cryptographic proof certificate for ', data.fileName,
            '","image":"data:image/svg+xml;base64,', svgBase64,
            '","attributes":[',
            '{"trait_type":"Proof ID","value":"', data.proofId, '"},',
            '{"trait_type":"File Name","value":"', data.fileName, '"},',
            '{"trait_type":"File Size","value":"', data.fileSize.toString(), '"},',
            '{"trait_type":"IPFS CID","value":"', data.cid, '"},',
            '{"display_type":"date","trait_type":"Timestamp","value":', data.timestamp.toString(), '}',
            ']}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }

    // Helper functions
    function _bytes32ToHexString(bytes32 data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            str[i*2] = alphabet[uint8(data[i] >> 4)];
            str[i*2+1] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }

    function _substring(string memory str, uint256 startIndex, uint256 endIndex) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    function _truncateString(string memory str, uint256 maxLen) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        if (strBytes.length <= maxLen) {
            return str;
        }
        bytes memory result = new bytes(maxLen);
        for (uint256 i = 0; i < maxLen - 3; i++) {
            result[i] = strBytes[i];
        }
        result[maxLen - 3] = '.';
        result[maxLen - 2] = '.';
        result[maxLen - 1] = '.';
        return string(result);
    }

    // Required overrides
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
