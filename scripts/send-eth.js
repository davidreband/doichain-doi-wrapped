// Send test ETH for gas fees
const { ethers } = require("hardhat");

async function main() {
  console.log("⛽ Sending test ETH for gas fees...\n");

  // Get the owner account (has plenty of ETH)
  const [owner] = await ethers.getSigners();
  console.log("📝 From account:", owner.address);

  // User's MetaMask address
  const userAddress = "0xB282Da8ee18b36aC00e255ec78da3a440a6FfA3D";
  console.log("📝 To account:", userAddress);

  // Send 10 ETH for gas fees
  const amount = ethers.parseEther("10.0");
  
  console.log("💸 Sending 10 ETH for gas fees...");
  const tx = await owner.sendTransaction({
    to: userAddress,
    value: amount
  });
  
  await tx.wait();
  console.log("✅ ETH sent successfully!");
  console.log(`📋 Transaction hash: ${tx.hash}`);
  console.log("\n🎉 You now have 10 ETH for gas fees!");
  console.log("🔄 Refresh MetaMask to see the ETH balance.");
}

main().catch(console.error);