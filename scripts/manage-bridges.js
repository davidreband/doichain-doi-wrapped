const hre = require("hardhat");

async function main() {
  // Load deployment information
  const fs = require('fs');
  const networkFile = `./deployments/${hre.network.name}.json`;
  
  if (!fs.existsSync(networkFile)) {
    console.error("❌ Deployment file not found. Please deploy the contract first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(networkFile));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("🌉 Managing Wrapped Doichain Bridges");
  console.log("📍 Contract:", contractAddress);
  console.log("🌐 Network:", hre.network.name);
  console.log("");

  // Connect to contract
  const WrappedDoichain = await hre.ethers.getContractFactory("WrappedDoichain");
  const contract = WrappedDoichain.attach(contractAddress);

  const [admin] = await hre.ethers.getSigners();
  console.log("👤 Admin:", admin.address);

  // Get command line arguments
  const action = process.argv[2];
  const bridgeAddress = process.argv[3];

  if (!action) {
    console.log("📋 Available actions:");
    console.log("   list    - List all bridges");
    console.log("   add     - Add new bridge (requires bridge address)");
    console.log("   remove  - Remove bridge (requires bridge address)");
    console.log("");
    console.log("Usage examples:");
    console.log("   npx hardhat run scripts/manage-bridges.js list");
    console.log("   npx hardhat run scripts/manage-bridges.js add 0x1234...");
    console.log("   npx hardhat run scripts/manage-bridges.js remove 0x1234...");
    return;
  }

  try {
    switch (action) {
      case "list":
        await listBridges(contract);
        break;
        
      case "add":
        if (!bridgeAddress) {
          console.error("❌ Bridge address required for add action");
          return;
        }
        await addBridge(contract, bridgeAddress);
        break;
        
      case "remove":
        if (!bridgeAddress) {
          console.error("❌ Bridge address required for remove action");
          return;
        }
        await removeBridge(contract, bridgeAddress);
        break;
        
      default:
        console.error("❌ Unknown action:", action);
        return;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function listBridges(contract) {
  console.log("🔍 Checking bridge roles...");
  
  const BRIDGE_ROLE = await contract.BRIDGE_ROLE();
  console.log("🔑 BRIDGE_ROLE:", BRIDGE_ROLE);
  
  // Here we can add logic to get all addresses with bridge role
  // OpenZeppelin AccessControl doesn't provide a direct way to get list of all addresses with a role
  console.log("ℹ️  To check if an address is a bridge, use: contract.isBridge(address)");
  
  // Show general contract information
  const info = await contract.getTokenInfo();
  console.log("");
  console.log("📊 Token Info:");
  console.log("   Total Supply:", hre.ethers.formatEther(info.tokenTotalSupply), "wDOI");
  console.log("   Total Deposited:", hre.ethers.formatEther(info.tokenTotalDeposited), "wDOI");
  console.log("   Total Withdrawn:", hre.ethers.formatEther(info.tokenTotalWithdrawn), "wDOI");
  console.log("   Is Paused:", info.isPaused);
}

async function addBridge(contract, bridgeAddress) {
  console.log("➕ Adding bridge:", bridgeAddress);
  
  // Check if address is not already a bridge
  const isBridge = await contract.isBridge(bridgeAddress);
  if (isBridge) {
    console.log("⚠️  Address is already a bridge");
    return;
  }
  
  // Add bridge
  const tx = await contract.addBridge(bridgeAddress);
  console.log("📝 Transaction hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Bridge added successfully!");
  console.log("⛽ Gas used:", receipt.gasUsed.toString());
  
  // Verification
  const isNowBridge = await contract.isBridge(bridgeAddress);
  console.log("✔️  Verification - Is bridge:", isNowBridge);
}

async function removeBridge(contract, bridgeAddress) {
  console.log("➖ Removing bridge:", bridgeAddress);
  
  // Check if address is a bridge
  const isBridge = await contract.isBridge(bridgeAddress);
  if (!isBridge) {
    console.log("⚠️  Address is not a bridge");
    return;
  }
  
  // Remove bridge
  const tx = await contract.removeBridge(bridgeAddress);
  console.log("📝 Transaction hash:", tx.hash);
  
  const receipt = await tx.wait();
  console.log("✅ Bridge removed successfully!");
  console.log("⛽ Gas used:", receipt.gasUsed.toString());
  
  // Verification
  const isStillBridge = await contract.isBridge(bridgeAddress);
  console.log("✔️  Verification - Is bridge:", isStillBridge);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });