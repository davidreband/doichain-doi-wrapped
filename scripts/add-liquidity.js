// Add initial liquidity to the latest pool
const { ethers } = require("hardhat");

async function main() {
  console.log("💧 Adding initial liquidity to pool...\n");

  const [owner] = await ethers.getSigners();
  console.log("📝 Using account:", owner.address);

  // Latest contract addresses from deployment
  const wdoiAddress = "0x5302E909d1e93e30F05B5D6Eea766363D14F9892";
  const usdtAddress = "0x986aaa537b8cc170761FDAC6aC4fc7F9d8a20A8C";
  const poolAddress = "0xe1Fd27F4390DcBE165f4D60DBF821e4B9Bb02dEd";

  // Connect to contracts
  const wdoiContract = await ethers.getContractAt("WrappedDoichainCustodial", wdoiAddress);
  const usdtContract = await ethers.getContractAt("WrappedDoichainCustodial", usdtAddress);
  const poolContract = await ethers.getContractAt("wDOIUSDTPool", poolAddress);

  // Check balances
  const wdoiBalance = await wdoiContract.balanceOf(owner.address);
  const usdtBalance = await usdtContract.balanceOf(owner.address);
  
  console.log("Current balances:");
  console.log("wDOI:", ethers.formatEther(wdoiBalance));
  console.log("USDT:", ethers.formatEther(usdtBalance));

  // Add liquidity: 1000 wDOI and 1000 USDT
  const liquidityAmount = ethers.parseEther("1000");

  console.log("\n🔑 Approving tokens...");
  await wdoiContract.approve(poolAddress, liquidityAmount);
  await usdtContract.approve(poolAddress, liquidityAmount);

  console.log("💧 Adding liquidity...");
  const tx = await poolContract.addLiquidity(
    liquidityAmount,
    liquidityAmount,
    ethers.parseEther("990"), // min wDOI (1% slippage)
    ethers.parseEther("990"), // min USDT (1% slippage)
  );

  await tx.wait();
  console.log("✅ Liquidity added successfully!");

  // Check pool info
  const poolInfo = await poolContract.getPoolInfo();
  console.log("\n📊 Pool Information:");
  console.log("wDOI Reserve:", ethers.formatEther(poolInfo[0]));
  console.log("USDT Reserve:", ethers.formatEther(poolInfo[1]));
  console.log("LP Token Supply:", ethers.formatEther(poolInfo[2]));
  console.log("wDOI Price:", ethers.formatEther(poolInfo[3]), "USDT");

  console.log("\n🎉 Pool is ready for trading!");
}

main().catch(console.error);