// Send tokens to the currently connected user in frontend
const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Sending tokens to frontend user...\n");

  // Get the owner account
  const [owner] = await ethers.getSigners();
  console.log("📝 From account:", owner.address);

  // User's MetaMask address
  const userAddress = "0xB282Da8ee18b36aC00e255ec78da3a440a6FfA3D";

  console.log("📝 To account:", userAddress);

  // Contract addresses
  const wdoiAddress = "0x5302E909d1e93e30F05B5D6Eea766363D14F9892";
  const usdtAddress = "0x986aaa537b8cc170761FDAC6aC4fc7F9d8a20A8C";

  // Connect to contracts
  const wdoiContract = await ethers.getContractAt("WrappedDoichainCustodial", wdoiAddress);
  const usdtContract = await ethers.getContractAt("WrappedDoichainCustodial", usdtAddress);

  // Send 100 of each token
  const amount = ethers.parseEther("100");

  console.log("📤 Sending 100 wDOI...");
  const tx1 = await wdoiContract.transfer(userAddress, amount);
  await tx1.wait();

  console.log("📤 Sending 100 Mock USDT...");
  const tx2 = await usdtContract.transfer(userAddress, amount);
  await tx2.wait();

  console.log("✅ Tokens sent successfully!");
  console.log("\n📋 Your tokens:");
  console.log(`- 100 wDOI at ${wdoiAddress}`);
  console.log(`- 100 Mock USDT at ${usdtAddress}`);
  console.log("\n🔄 Refresh the frontend to see updated balances!");
}

main().catch(console.error);