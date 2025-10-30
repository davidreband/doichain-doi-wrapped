// Send tokens to a specific user address for testing
const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Sending test tokens to users...\n");

  const [owner, user1, user2] = await ethers.getSigners();
  
  // Use your specific address or default to hardhat account #1
  const userAddress = "0xb282da8ee18b36ac00e255ec78da3a440a6ffa3d";
  console.log("📝 From account:", owner.address);
  console.log("📝 To account:", userAddress);

  // Latest contract addresses
  const wdoiAddress = "0x5302E909d1e93e30F05B5D6Eea766363D14F9892";
  const usdtAddress = "0x986aaa537b8cc170761FDAC6aC4fc7F9d8a20A8C";

  // Connect to contracts
  const wdoiContract = await ethers.getContractAt("WrappedDoichainCustodial", wdoiAddress);
  const usdtContract = await ethers.getContractAt("WrappedDoichainCustodial", usdtAddress);

  // Send 100 wDOI and 100 USDT
  const amount = ethers.parseEther("100");

  console.log("📤 Sending 100 wDOI...");
  await wdoiContract.transfer(userAddress, amount);

  console.log("📤 Sending 100 Mock USDT...");
  await usdtContract.transfer(userAddress, amount);

  console.log("✅ Tokens sent successfully!");
  console.log("\n📋 User now has:");
  console.log("- 100 wDOI at", wdoiAddress);
  console.log("- 100 Mock USDT at", usdtAddress);
  console.log("\nUser can add these tokens to MetaMask and test the pool!");
}

main().catch(console.error);