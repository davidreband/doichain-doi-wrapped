// Script to initialize Uniswap V3 pool and add initial liquidity
const { ethers } = require("hardhat");

async function main() {
  console.log("🏊 Initializing wDOI/USDT pool and adding liquidity...\n");

  // Contract addresses
  const ADDRESSES = {
    UNISWAP_V3_POOL: "0xa23e7d3FF97A989B3f09B4Ea8b64A5f104e8721B",
    UNISWAP_V3_POSITION_MANAGER: "0x1238536071E1c677A632429e3655c799b22cDA52",
    WDOI_TOKEN: "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5",
    USDT_TOKEN: "0x584d5D62adaa8123E1726777AA6EEa154De6c76f"
  };

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Pool ABI for initialization
  const poolAbi = [
    "function initialize(uint160 sqrtPriceX96) external",
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
  ];

  // Position Manager ABI for adding liquidity
  const positionManagerAbi = [
    "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)"
  ];

  // ERC20 ABI for approvals and balances
  const erc20Abi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)"
  ];

  try {
    // Get contracts
    const poolContract = new ethers.Contract(ADDRESSES.UNISWAP_V3_POOL, poolAbi, deployer);
    const positionManager = new ethers.Contract(ADDRESSES.UNISWAP_V3_POSITION_MANAGER, positionManagerAbi, deployer);
    const wdoiToken = new ethers.Contract(ADDRESSES.WDOI_TOKEN, erc20Abi, deployer);
    const usdtToken = new ethers.Contract(ADDRESSES.USDT_TOKEN, erc20Abi, deployer);

    // Check token balances
    const [wdoiBalance, usdtBalance, wdoiSymbol, usdtSymbol] = await Promise.all([
      wdoiToken.balanceOf(deployer.address),
      usdtToken.balanceOf(deployer.address),
      wdoiToken.symbol(),
      usdtToken.symbol()
    ]);

    console.log("💰 Token Balances:");
    console.log(`${wdoiSymbol}: ${ethers.formatEther(wdoiBalance)}`);
    console.log(`${usdtSymbol}: ${ethers.formatUnits(usdtBalance, 6)}\n`);

    // Check if pool is already initialized
    try {
      const slot0 = await poolContract.slot0();
      if (slot0.sqrtPriceX96 > 0) {
        console.log("✅ Pool already initialized!");
        console.log(`Current price: ${slot0.sqrtPriceX96.toString()}\n`);
      } else {
        throw new Error("Not initialized");
      }
    } catch (error) {
      // Pool not initialized, let's initialize it
      console.log("🔧 Pool not initialized. Initializing with price...");
      
      // Calculate sqrtPriceX96 for 1 wDOI = 1 USDT (accounting for decimals)
      // wDOI (18 decimals) vs USDT (6 decimals)
      // Price = USDT/wDOI = 1e6/1e18 = 1e-12
      // sqrtPrice = sqrt(1e-12) = 1e-6
      // sqrtPriceX96 = 1e-6 * 2^96
      
      const sqrtPriceX96 = "79228162514264337593"; // Approximately 1e-6 * 2^96

      console.log(`Setting initial price (sqrtPriceX96): ${sqrtPriceX96}`);

      const initTx = await poolContract.initialize(sqrtPriceX96, { gasLimit: 500000 });
      console.log("⏳ Initialization transaction:", initTx.hash);
      await initTx.wait();
      console.log("✅ Pool initialized!\n");
    }

    // Now add liquidity if we have tokens
    const wdoiAmount = ethers.parseEther("100"); // 100 wDOI
    const usdtAmount = ethers.parseUnits("100", 6); // 100 USDT

    if (wdoiBalance < wdoiAmount) {
      console.log(`❌ Insufficient wDOI balance. Need: ${ethers.formatEther(wdoiAmount)}, Have: ${ethers.formatEther(wdoiBalance)}`);
      return;
    }

    if (usdtBalance < usdtAmount) {
      console.log(`❌ Insufficient USDT balance. Need: ${ethers.formatUnits(usdtAmount, 6)}, Have: ${ethers.formatUnits(usdtBalance, 6)}`);
      return;
    }

    console.log("💧 Adding initial liquidity...");
    console.log(`Adding: ${ethers.formatEther(wdoiAmount)} wDOI + ${ethers.formatUnits(usdtAmount, 6)} USDT\n`);

    // Approve tokens for position manager
    console.log("🔓 Approving tokens...");
    
    const wdoiAllowance = await wdoiToken.allowance(deployer.address, ADDRESSES.UNISWAP_V3_POSITION_MANAGER);
    if (wdoiAllowance < wdoiAmount) {
      const approveTx1 = await wdoiToken.approve(ADDRESSES.UNISWAP_V3_POSITION_MANAGER, wdoiAmount);
      await approveTx1.wait();
      console.log("✅ wDOI approved");
    }

    const usdtAllowance = await usdtToken.allowance(deployer.address, ADDRESSES.UNISWAP_V3_POSITION_MANAGER);
    if (usdtAllowance < usdtAmount) {
      const approveTx2 = await usdtToken.approve(ADDRESSES.UNISWAP_V3_POSITION_MANAGER, usdtAmount);
      await approveTx2.wait();
      console.log("✅ USDT approved");
    }

    // Sort tokens (Uniswap requires token0 < token1)
    const token0 = ADDRESSES.WDOI_TOKEN.toLowerCase() < ADDRESSES.USDT_TOKEN.toLowerCase() 
      ? ADDRESSES.WDOI_TOKEN : ADDRESSES.USDT_TOKEN;
    const token1 = ADDRESSES.WDOI_TOKEN.toLowerCase() < ADDRESSES.USDT_TOKEN.toLowerCase() 
      ? ADDRESSES.USDT_TOKEN : ADDRESSES.WDOI_TOKEN;

    const amount0 = token0 === ADDRESSES.WDOI_TOKEN ? wdoiAmount : usdtAmount;
    const amount1 = token0 === ADDRESSES.WDOI_TOKEN ? usdtAmount : wdoiAmount;

    // Add liquidity (full range for simplicity: tick -887220 to 887220)
    const mintParams = {
      token0: token0,
      token1: token1,
      fee: 3000, // 0.3%
      tickLower: -887220, // Full range
      tickUpper: 887220,  // Full range
      amount0Desired: amount0,
      amount1Desired: amount1,
      amount0Min: amount0 * 95n / 100n, // 5% slippage
      amount1Min: amount1 * 95n / 100n, // 5% slippage
      recipient: deployer.address,
      deadline: Math.floor(Date.now() / 1000) + 1800 // 30 minutes
    };

    console.log("🏊 Adding liquidity to pool...");
    const mintTx = await positionManager.mint(mintParams, { gasLimit: 2000000 });
    console.log("⏳ Liquidity transaction:", mintTx.hash);
    const receipt = await mintTx.wait();
    console.log("✅ Liquidity added successfully!\n");

    console.log("🎉 Pool Setup Complete!");
    console.log("🏊 Pool Address:", ADDRESSES.UNISWAP_V3_POOL);
    console.log("💱 Ready for trading on Uniswap!");
    console.log("\n🔗 Trade on Uniswap:");
    console.log(`https://app.uniswap.org/#/swap?inputCurrency=${ADDRESSES.USDT_TOKEN}&outputCurrency=${ADDRESSES.WDOI_TOKEN}&chain=sepolia`);

  } catch (error) {
    console.error("❌ Error:", error);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main().catch(console.error);