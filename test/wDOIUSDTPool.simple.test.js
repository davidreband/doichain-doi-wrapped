const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("wDOIUSDTPool Simple Test", function () {
  let wdoiToken, usdtToken, usdtPool;
  let owner, user1;
  
  const INITIAL_WDOI_SUPPLY = ethers.parseEther("10000"); // 10,000 wDOI
  const INITIAL_USDT_SUPPLY = ethers.parseUnits("10000", 6); // 10,000 USDT (6 decimals)

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // Deploy wDOI token (using custodial version)
    const WrappedDoichainCustodial = await ethers.getContractFactory("WrappedDoichainCustodial");
    wdoiToken = await WrappedDoichainCustodial.deploy(owner.address, 1);

    // Setup wDOI token
    await wdoiToken.addCustodian(owner.address, "Test Custodian", "test_address");
    await wdoiToken.addMerchant(owner.address);
    await wdoiToken.requestMint(owner.address, INITIAL_WDOI_SUPPLY, "test_tx_1", "test_custodian");
    await wdoiToken.confirmMint(1);

    // Create simple ERC20 contract as mock USDT (also with 18 decimals for simplicity)
    usdtToken = await WrappedDoichainCustodial.deploy(owner.address, 1);
    await usdtToken.addCustodian(owner.address, "Test Custodian", "test_address");
    await usdtToken.addMerchant(owner.address);
    await usdtToken.requestMint(owner.address, INITIAL_WDOI_SUPPLY, "test_tx_2", "test_custodian");
    await usdtToken.confirmMint(1);

    // Deploy wDOI/USDT liquidity pool
    const USDTPool = await ethers.getContractFactory("wDOIUSDTPool");
    usdtPool = await USDTPool.deploy(
      await wdoiToken.getAddress(), 
      await usdtToken.getAddress(), 
      owner.address
    );

    // Prepare tokens for users
    await wdoiToken.transfer(user1.address, ethers.parseEther("2000"));
    await usdtToken.transfer(user1.address, ethers.parseEther("2000")); // Using 18 decimals as mock
  });

  describe("Deployment", function () {
    it("Should set correct parameters", async function () {
      expect(await usdtPool.name()).to.equal("wDOI-USDT LP");
      expect(await usdtPool.symbol()).to.equal("wDOI-USDT-LP");
      expect(await usdtPool.owner()).to.equal(owner.address);
      expect(await usdtPool.wDOI()).to.equal(await wdoiToken.getAddress());
      expect(await usdtPool.USDT()).to.equal(await usdtToken.getAddress());
    });

    it("Should have zero initial reserves", async function () {
      const poolInfo = await usdtPool.getPoolInfo();
      expect(poolInfo[0]).to.equal(0); // reserveWDOI
      expect(poolInfo[1]).to.equal(0); // reserveUSDT
      expect(poolInfo[2]).to.equal(0); // totalSupply
    });
  });

  describe("Basic Functionality", function () {
    it("Should add initial liquidity", async function () {
      const wdoiAmount = ethers.parseEther("1000");
      const usdtAmount = ethers.parseEther("1000"); // Using 18 decimals for simplicity

      // Approve tokens
      await wdoiToken.approve(await usdtPool.getAddress(), wdoiAmount);
      await usdtToken.approve(await usdtPool.getAddress(), usdtAmount);

      // Add liquidity
      await expect(usdtPool.addLiquidity(
        wdoiAmount,
        usdtAmount,
        wdoiAmount,
        usdtAmount
      ))
        .to.emit(usdtPool, "LiquidityAdded")
        .to.emit(usdtPool, "ReservesUpdated");

      // Check reserves
      const poolInfo = await usdtPool.getPoolInfo();
      expect(poolInfo[0]).to.equal(wdoiAmount); // reserveWDOI
      expect(poolInfo[1]).to.equal(usdtAmount);  // reserveUSDT
      expect(poolInfo[2]).to.be.gt(0); // totalSupply LP tokens
    });

    it("Should execute USDT → wDOI swap", async function () {
      // Add liquidity first
      const wdoiAmount = ethers.parseEther("1000");
      const usdtAmount = ethers.parseEther("1000");

      await wdoiToken.approve(await usdtPool.getAddress(), wdoiAmount);
      await usdtToken.approve(await usdtPool.getAddress(), usdtAmount);
      await usdtPool.addLiquidity(wdoiAmount, usdtAmount, wdoiAmount, usdtAmount);

      // Execute USDT → wDOI swap
      const swapUSDT = ethers.parseEther("100");
      const initialWDOI = await wdoiToken.balanceOf(user1.address);

      await usdtToken.connect(user1).approve(await usdtPool.getAddress(), swapUSDT);
      
      await expect(usdtPool.connect(user1).swapUSDTForWDOI(swapUSDT, 0))
        .to.emit(usdtPool, "SwapUSDTForWDOI");

      const finalWDOI = await wdoiToken.balanceOf(user1.address);
      expect(finalWDOI).to.be.gt(initialWDOI);
    });

    it("Should calculate wDOI price", async function () {
      // Add 1:1 liquidity
      const amount = ethers.parseEther("1000");
      await wdoiToken.approve(await usdtPool.getAddress(), amount);
      await usdtToken.approve(await usdtPool.getAddress(), amount);
      await usdtPool.addLiquidity(amount, amount, amount, amount);

      const price = await usdtPool.getWDOIPrice();
      // At 1:1 ratio price should be approximately 1e18 (1 in 18 decimals)
      expect(price).to.equal(ethers.parseEther("1"));
    });

    it("Should allow owner to collect fees", async function () {
      // Add liquidity
      const amount = ethers.parseEther("1000");
      await wdoiToken.approve(await usdtPool.getAddress(), amount);
      await usdtToken.approve(await usdtPool.getAddress(), amount);
      await usdtPool.addLiquidity(amount, amount, amount, amount);

      // Make swap to accumulate fees
      const swapAmount = ethers.parseEther("100");
      await usdtToken.connect(user1).approve(await usdtPool.getAddress(), swapAmount);
      await usdtPool.connect(user1).swapUSDTForWDOI(swapAmount, 0);

      // Collect fees
      await expect(usdtPool.collectFees())
        .to.emit(usdtPool, "FeesCollected");
    });

    it("Should not allow non-owner to collect fees", async function () {
      await expect(usdtPool.connect(user1).collectFees())
        .to.be.revertedWithCustomError(usdtPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pool Information", function () {
    it("Should return correct pool info", async function () {
      // Add liquidity
      const amount = ethers.parseEther("1000");
      await wdoiToken.approve(await usdtPool.getAddress(), amount);
      await usdtToken.approve(await usdtPool.getAddress(), amount);
      await usdtPool.addLiquidity(amount, amount, amount, amount);

      const poolInfo = await usdtPool.getPoolInfo();
      
      expect(poolInfo[0]).to.equal(amount); // reserveWDOI
      expect(poolInfo[1]).to.equal(amount); // reserveUSDT  
      expect(poolInfo[2]).to.be.gt(0); // totalSupply
      expect(poolInfo[3]).to.equal(ethers.parseEther("1")); // wdoiPrice (1:1)
    });
  });
});