// Script to check wDOI/USDT pool status
const { ethers } = require("hardhat");

async function main() {
  console.log("🏊 Checking wDOI/USDT Pool Status...\n");

  // Contract addresses from deployment
  const ADDRESSES = {
    WDOI_TOKEN: "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5",
    USDT_TOKEN: "0x584d5D62adaa8123E1726777AA6EEa154De6c76f",
    USDT_POOL: "0xf683c80D070ED88AbC4321F7E1d4807C87cDca2C"
  };

  const provider = ethers.provider;
  const [signer] = await ethers.getSigners();
  
  console.log(`📡 Connected to: ${provider.connection?.url || 'localhost'}`);
  console.log(`👤 Signer: ${signer.address}\n`);

  // Check if contracts exist
  console.log("🔍 Checking contract deployment...");
  for (const [name, address] of Object.entries(ADDRESSES)) {
    const code = await provider.getCode(address);
    const status = code === "0x" ? "❌ NOT DEPLOYED" : "✅ DEPLOYED";
    console.log(`${name}: ${address} - ${status}`);
  }
  console.log();

  // Pool ABI
  const POOL_ABI = [
    "function getPoolInfo() external view returns (uint256, uint256, uint256, uint256, uint256, uint256)",
    "function reserveWDOI() external view returns (uint256)",
    "function reserveUSDT() external view returns (uint256)",
    "function totalSupply() external view returns (uint256)",
    "function getWDOIPrice() external view returns (uint256)",
    "function balanceOf(address) external view returns (uint256)"
  ];

  // ERC20 ABI
  const ERC20_ABI = [
    "function balanceOf(address) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function name() external view returns (string)"
  ];

  try {
    // Create contract instances
    const poolContract = new ethers.Contract(ADDRESSES.USDT_POOL, POOL_ABI, provider);
    const wdoiContract = new ethers.Contract(ADDRESSES.WDOI_TOKEN, ERC20_ABI, provider);
    const usdtContract = new ethers.Contract(ADDRESSES.USDT_TOKEN, ERC20_ABI, provider);

    // Get pool information
    console.log("📊 Pool Information:");
    const poolInfo = await poolContract.getPoolInfo();
    const reserveWDOI = poolInfo[0];
    const reserveUSDT = poolInfo[1];
    const totalSupply = poolInfo[2];
    const wdoiPrice = poolInfo[3];

    console.log(`Reserve wDOI: ${ethers.formatEther(reserveWDOI)} wDOI`);
    console.log(`Reserve USDT: ${ethers.formatUnits(reserveUSDT, 6)} USDT`);
    console.log(`LP Token Supply: ${ethers.formatEther(totalSupply)} LP`);
    console.log(`wDOI Price: ${ethers.formatUnits(wdoiPrice, 18)} USDT per wDOI`);
    
    // Calculate TVL
    const tvlUSDT = parseFloat(ethers.formatUnits(reserveUSDT, 6)) * 2; // Assuming 1:1 USD
    console.log(`💰 Total Value Locked: ~$${tvlUSDT.toFixed(2)} USD\n`);

    // Check user balances
    console.log("👤 Your Balances:");
    const userWDOI = await wdoiContract.balanceOf(signer.address);
    const userUSDT = await usdtContract.balanceOf(signer.address);
    const userLP = await poolContract.balanceOf(signer.address);

    console.log(`wDOI: ${ethers.formatEther(userWDOI)} wDOI`);
    console.log(`USDT: ${ethers.formatUnits(userUSDT, 6)} USDT`);
    console.log(`LP Tokens: ${ethers.formatEther(userLP)} LP\n`);

    // Token information
    console.log("🪙 Token Information:");
    const wdoiName = await wdoiContract.name();
    const wdoiSymbol = await wdoiContract.symbol();
    const usdtName = await usdtContract.name();
    const usdtSymbol = await usdtContract.symbol();

    console.log(`${wdoiName} (${wdoiSymbol}): ${ADDRESSES.WDOI_TOKEN}`);
    console.log(`${usdtName} (${usdtSymbol}): ${ADDRESSES.USDT_TOKEN}`);

  } catch (error) {
    console.error("❌ Error checking pool:", error.message);
  }
}

main().catch(console.error);