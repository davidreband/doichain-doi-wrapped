// Simple script to check which contracts are deployed and working
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking deployed contracts...\n");

  const provider = ethers.provider;
  const [signer] = await ethers.getSigners();
  
  const addresses = [
    "0x5FbDB2315678afecb367f032d93F642f64180aa3", // wDOI
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Old pool
    "0xa51c1fc2f0d1a1b8494ed1fe312d7c3a78ed91c0", // Test pool
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // Other contract
  ];

  for (const addr of addresses) {
    try {
      const code = await provider.getCode(addr);
      if (code === "0x") {
        console.log(`❌ ${addr} - No contract deployed`);
      } else {
        console.log(`✅ ${addr} - Contract exists (${code.length} bytes)`);
      }
    } catch (error) {
      console.log(`❌ ${addr} - Error: ${error.message}`);
    }
  }

  console.log("\n🧪 Testing balanceOf calls...");
  
  const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];
  
  for (const addr of addresses) {
    try {
      const code = await provider.getCode(addr);
      if (code !== "0x") {
        const contract = new ethers.Contract(addr, ERC20_ABI, provider);
        const balance = await contract.balanceOf(signer.address);
        console.log(`✅ ${addr} - balanceOf works: ${ethers.formatEther(balance)} tokens`);
      }
    } catch (error) {
      console.log(`❌ ${addr} - balanceOf failed: ${error.message}`);
    }
  }
}

main().catch(console.error);