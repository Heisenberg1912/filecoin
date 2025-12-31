const hre = require("hardhat");

async function main() {
  console.log("Deploying ProofVault contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  console.log("");

  // Deploy ProofRegistry
  console.log("Deploying ProofRegistry...");
  const ProofRegistry = await hre.ethers.getContractFactory("ProofRegistry");
  const proofRegistry = await ProofRegistry.deploy();
  await proofRegistry.waitForDeployment();
  const registryAddress = await proofRegistry.getAddress();
  console.log("ProofRegistry deployed to:", registryAddress);

  // Deploy ProofNFT
  console.log("\nDeploying ProofNFT...");
  const ProofNFT = await hre.ethers.getContractFactory("ProofNFT");
  const proofNFT = await ProofNFT.deploy();
  await proofNFT.waitForDeployment();
  const nftAddress = await proofNFT.getAddress();
  console.log("ProofNFT deployed to:", nftAddress);

  console.log("\n========================================");
  console.log("Deployment Summary");
  console.log("========================================");
  console.log("Network:", hre.network.name);
  console.log("ProofRegistry:", registryAddress);
  console.log("ProofNFT:", nftAddress);
  console.log("========================================\n");

  // Generate frontend config
  const config = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contracts: {
      ProofRegistry: registryAddress,
      ProofNFT: nftAddress
    },
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  const fs = require("fs");
  const path = require("path");

  // Save to contracts directory
  fs.writeFileSync(
    path.join(__dirname, "../deployments.json"),
    JSON.stringify(config, null, 2)
  );
  console.log("Saved deployment config to contracts/deployments.json");

  // Also save to frontend src directory
  const frontendPath = path.join(__dirname, "../../src/lib/contracts.json");
  fs.writeFileSync(frontendPath, JSON.stringify(config, null, 2));
  console.log("Saved deployment config to src/lib/contracts.json");

  // Verify on Polygonscan (if not local)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    console.log("Verifying contracts on Polygonscan...");

    try {
      await hre.run("verify:verify", {
        address: registryAddress,
        constructorArguments: []
      });
      console.log("ProofRegistry verified!");
    } catch (err) {
      console.log("ProofRegistry verification failed:", err.message);
    }

    try {
      await hre.run("verify:verify", {
        address: nftAddress,
        constructorArguments: []
      });
      console.log("ProofNFT verified!");
    } catch (err) {
      console.log("ProofNFT verification failed:", err.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
