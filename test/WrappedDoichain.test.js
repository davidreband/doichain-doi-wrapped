const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WrappedDoichain", function () {
  let wrappedDoichain;
  let admin, bridge1, bridge2, user1, user2, nonAuthorized;
  let BRIDGE_ROLE, PAUSER_ROLE, DEFAULT_ADMIN_ROLE;

  beforeEach(async function () {
    [admin, bridge1, bridge2, user1, user2, nonAuthorized] = await ethers.getSigners();

    // Deploy contract
    const WrappedDoichain = await ethers.getContractFactory("WrappedDoichain");
    wrappedDoichain = await WrappedDoichain.deploy(admin.address, [bridge1.address]);

    // Get role constants
    BRIDGE_ROLE = await wrappedDoichain.BRIDGE_ROLE();
    PAUSER_ROLE = await wrappedDoichain.PAUSER_ROLE();
    DEFAULT_ADMIN_ROLE = await wrappedDoichain.DEFAULT_ADMIN_ROLE();
  });

  describe("Deployment", function () {
    it("Should set correct token properties", async function () {
      expect(await wrappedDoichain.name()).to.equal("Wrapped Doichain");
      expect(await wrappedDoichain.symbol()).to.equal("wDOI");
      expect(await wrappedDoichain.decimals()).to.equal(18);
      expect(await wrappedDoichain.totalSupply()).to.equal(0);
    });

    it("Should assign admin role to deployer", async function () {
      expect(await wrappedDoichain.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await wrappedDoichain.hasRole(PAUSER_ROLE, admin.address)).to.be.true;
    });

    it("Should assign bridge role to initial bridges", async function () {
      expect(await wrappedDoichain.isBridge(bridge1.address)).to.be.true;
      expect(await wrappedDoichain.hasRole(BRIDGE_ROLE, bridge1.address)).to.be.true;
    });

    it("Should initialize statistics", async function () {
      expect(await wrappedDoichain.totalDeposited()).to.equal(0);
      expect(await wrappedDoichain.totalWithdrawn()).to.equal(0);
    });
  });

  describe("Bridge Management", function () {
    it("Should allow admin to add new bridge", async function () {
      expect(await wrappedDoichain.isBridge(bridge2.address)).to.be.false;
      
      await expect(wrappedDoichain.connect(admin).addBridge(bridge2.address))
        .to.emit(wrappedDoichain, "BridgeAdded")
        .withArgs(bridge2.address);
      
      expect(await wrappedDoichain.isBridge(bridge2.address)).to.be.true;
    });

    it("Should allow admin to remove bridge", async function () {
      expect(await wrappedDoichain.isBridge(bridge1.address)).to.be.true;
      
      await expect(wrappedDoichain.connect(admin).removeBridge(bridge1.address))
        .to.emit(wrappedDoichain, "BridgeRemoved")
        .withArgs(bridge1.address);
      
      expect(await wrappedDoichain.isBridge(bridge1.address)).to.be.false;
    });

    it("Should not allow non-admin to add bridge", async function () {
      await expect(wrappedDoichain.connect(nonAuthorized).addBridge(bridge2.address))
        .to.be.revertedWithCustomError(wrappedDoichain, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow adding zero address as bridge", async function () {
      await expect(wrappedDoichain.connect(admin).addBridge(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid bridge address");
    });
  });

  describe("Deposit Functionality", function () {
    const depositAmount = ethers.parseEther("100");
    const doichainTxHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    it("Should allow bridge to deposit tokens", async function () {
      await expect(wrappedDoichain.connect(bridge1).deposit(user1.address, depositAmount, doichainTxHash))
        .to.emit(wrappedDoichain, "Deposit")
        .withArgs(user1.address, depositAmount, doichainTxHash, bridge1.address)
        .and.to.emit(wrappedDoichain, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, depositAmount);

      expect(await wrappedDoichain.balanceOf(user1.address)).to.equal(depositAmount);
      expect(await wrappedDoichain.totalSupply()).to.equal(depositAmount);
      expect(await wrappedDoichain.totalDeposited()).to.equal(depositAmount);
      expect(await wrappedDoichain.processedDeposits(doichainTxHash)).to.be.true;
    });

    it("Should not allow non-bridge to deposit", async function () {
      await expect(wrappedDoichain.connect(nonAuthorized).deposit(user1.address, depositAmount, doichainTxHash))
        .to.be.revertedWithCustomError(wrappedDoichain, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow duplicate deposits", async function () {
      await wrappedDoichain.connect(bridge1).deposit(user1.address, depositAmount, doichainTxHash);
      
      await expect(wrappedDoichain.connect(bridge1).deposit(user2.address, depositAmount, doichainTxHash))
        .to.be.revertedWith("Deposit already processed");
    });

    it("Should not allow deposit to zero address", async function () {
      await expect(wrappedDoichain.connect(bridge1).deposit(ethers.ZeroAddress, depositAmount, doichainTxHash))
        .to.be.revertedWith("Invalid user address");
    });

    it("Should not allow zero amount deposit", async function () {
      await expect(wrappedDoichain.connect(bridge1).deposit(user1.address, 0, doichainTxHash))
        .to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Withdrawal Functionality", function () {
    const depositAmount = ethers.parseEther("100");
    const withdrawAmount = ethers.parseEther("50");
    const doichainTxHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const doichainAddress = "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm";

    beforeEach(async function () {
      // First make a deposit
      await wrappedDoichain.connect(bridge1).deposit(user1.address, depositAmount, doichainTxHash);
    });

    it("Should allow bridge to withdraw tokens", async function () {
      await expect(wrappedDoichain.connect(bridge1).withdraw(user1.address, withdrawAmount, doichainAddress))
        .to.emit(wrappedDoichain, "Withdrawal")
        .withArgs(user1.address, withdrawAmount, doichainAddress, bridge1.address)
        .and.to.emit(wrappedDoichain, "Transfer")
        .withArgs(user1.address, ethers.ZeroAddress, withdrawAmount);

      expect(await wrappedDoichain.balanceOf(user1.address)).to.equal(depositAmount - withdrawAmount);
      expect(await wrappedDoichain.totalSupply()).to.equal(depositAmount - withdrawAmount);
      expect(await wrappedDoichain.totalWithdrawn()).to.equal(withdrawAmount);
    });

    it("Should not allow non-bridge to withdraw", async function () {
      await expect(wrappedDoichain.connect(nonAuthorized).withdraw(user1.address, withdrawAmount, doichainAddress))
        .to.be.revertedWithCustomError(wrappedDoichain, "AccessControlUnauthorizedAccount");
    });

    it("Should not allow withdrawal with insufficient balance", async function () {
      const excessiveAmount = ethers.parseEther("200");
      await expect(wrappedDoichain.connect(bridge1).withdraw(user1.address, excessiveAmount, doichainAddress))
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should not allow withdrawal to empty Doichain address", async function () {
      await expect(wrappedDoichain.connect(bridge1).withdraw(user1.address, withdrawAmount, ""))
        .to.be.revertedWith("Invalid Doichain address");
    });

    it("Should not allow zero amount withdrawal", async function () {
      await expect(wrappedDoichain.connect(bridge1).withdraw(user1.address, 0, doichainAddress))
        .to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Pause Functionality", function () {
    const depositAmount = ethers.parseEther("100");
    const doichainTxHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    it("Should allow pauser to pause contract", async function () {
      await wrappedDoichain.connect(admin).pause();
      expect(await wrappedDoichain.paused()).to.be.true;
    });

    it("Should not allow non-pauser to pause", async function () {
      await expect(wrappedDoichain.connect(nonAuthorized).pause())
        .to.be.revertedWithCustomError(wrappedDoichain, "AccessControlUnauthorizedAccount");
    });

    it("Should block deposits when paused", async function () {
      await wrappedDoichain.connect(admin).pause();
      
      await expect(wrappedDoichain.connect(bridge1).deposit(user1.address, depositAmount, doichainTxHash))
        .to.be.revertedWithCustomError(wrappedDoichain, "EnforcedPause");
    });

    it("Should block transfers when paused", async function () {
      // First deposit
      await wrappedDoichain.connect(bridge1).deposit(user1.address, depositAmount, doichainTxHash);
      
      // Then pause
      await wrappedDoichain.connect(admin).pause();
      
      // Transfer should be blocked
      await expect(wrappedDoichain.connect(user1).transfer(user2.address, ethers.parseEther("10")))
        .to.be.revertedWithCustomError(wrappedDoichain, "EnforcedPause");
    });

    it("Should allow unpausing", async function () {
      await wrappedDoichain.connect(admin).pause();
      await wrappedDoichain.connect(admin).unpause();
      expect(await wrappedDoichain.paused()).to.be.false;
    });
  });

  describe("Token Information", function () {
    it("Should return correct token info", async function () {
      const info = await wrappedDoichain.getTokenInfo();
      
      expect(info.tokenName).to.equal("Wrapped Doichain");
      expect(info.tokenSymbol).to.equal("wDOI");
      expect(info.tokenDecimals).to.equal(18);
      expect(info.tokenTotalSupply).to.equal(0);
      expect(info.tokenTotalDeposited).to.equal(0);
      expect(info.tokenTotalWithdrawn).to.equal(0);
      expect(info.isPaused).to.be.false;
    });
  });

  describe("ERC20 Functionality", function () {
    const depositAmount = ethers.parseEther("100");
    const doichainTxHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    beforeEach(async function () {
      await wrappedDoichain.connect(bridge1).deposit(user1.address, depositAmount, doichainTxHash);
    });

    it("Should support standard ERC20 transfers", async function () {
      const transferAmount = ethers.parseEther("25");
      
      await expect(wrappedDoichain.connect(user1).transfer(user2.address, transferAmount))
        .to.emit(wrappedDoichain, "Transfer")
        .withArgs(user1.address, user2.address, transferAmount);

      expect(await wrappedDoichain.balanceOf(user1.address)).to.equal(depositAmount - transferAmount);
      expect(await wrappedDoichain.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("Should support approve and transferFrom", async function () {
      const allowanceAmount = ethers.parseEther("30");
      const transferAmount = ethers.parseEther("20");

      await wrappedDoichain.connect(user1).approve(user2.address, allowanceAmount);
      expect(await wrappedDoichain.allowance(user1.address, user2.address)).to.equal(allowanceAmount);

      await wrappedDoichain.connect(user2).transferFrom(user1.address, user2.address, transferAmount);
      
      expect(await wrappedDoichain.balanceOf(user1.address)).to.equal(depositAmount - transferAmount);
      expect(await wrappedDoichain.balanceOf(user2.address)).to.equal(transferAmount);
      expect(await wrappedDoichain.allowance(user1.address, user2.address)).to.equal(allowanceAmount - transferAmount);
    });

    it("Should support burning tokens", async function () {
      const burnAmount = ethers.parseEther("10");
      
      await expect(wrappedDoichain.connect(user1).burn(burnAmount))
        .to.emit(wrappedDoichain, "Transfer")
        .withArgs(user1.address, ethers.ZeroAddress, burnAmount);

      expect(await wrappedDoichain.balanceOf(user1.address)).to.equal(depositAmount - burnAmount);
      expect(await wrappedDoichain.totalSupply()).to.equal(depositAmount - burnAmount);
    });
  });

  describe("Statistical Tracking", function () {
    const deposit1Amount = ethers.parseEther("100");
    const deposit2Amount = ethers.parseEther("50");
    const withdrawAmount = ethers.parseEther("30");
    
    it("Should track total deposited and withdrawn correctly", async function () {
      // First deposit
      await wrappedDoichain.connect(bridge1).deposit(
        user1.address, 
        deposit1Amount, 
        "tx1"
      );
      
      // Second deposit
      await wrappedDoichain.connect(bridge1).deposit(
        user2.address, 
        deposit2Amount, 
        "tx2"
      );
      
      expect(await wrappedDoichain.totalDeposited()).to.equal(deposit1Amount + deposit2Amount);
      
      // Withdrawal
      await wrappedDoichain.connect(bridge1).withdraw(
        user1.address, 
        withdrawAmount, 
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      );
      
      expect(await wrappedDoichain.totalWithdrawn()).to.equal(withdrawAmount);
      expect(await wrappedDoichain.totalSupply()).to.equal(deposit1Amount + deposit2Amount - withdrawAmount);
    });
  });
});