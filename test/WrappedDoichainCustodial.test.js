const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WrappedDoichainCustodial", function () {
  let wrappedDoichain;
  let admin, custodian1, custodian2, merchant1, merchant2, user1, user2, nonAuthorized;
  let CUSTODIAN_ROLE, MERCHANT_ROLE, PAUSER_ROLE, RESERVE_MANAGER_ROLE, DEFAULT_ADMIN_ROLE;

  beforeEach(async function () {
    [admin, custodian1, custodian2, merchant1, merchant2, user1, user2, nonAuthorized] = await ethers.getSigners();

    // Deploy custodial contract
    const WrappedDoichainCustodial = await ethers.getContractFactory("WrappedDoichainCustodial");
    wrappedDoichain = await WrappedDoichainCustodial.deploy(admin.address, 2); // Requires 2 confirmations

    // Get role constants
    CUSTODIAN_ROLE = await wrappedDoichain.CUSTODIAN_ROLE();
    MERCHANT_ROLE = await wrappedDoichain.MERCHANT_ROLE();
    PAUSER_ROLE = await wrappedDoichain.PAUSER_ROLE();
    RESERVE_MANAGER_ROLE = await wrappedDoichain.RESERVE_MANAGER_ROLE();
    DEFAULT_ADMIN_ROLE = await wrappedDoichain.DEFAULT_ADMIN_ROLE();
  });

  describe("Deployment", function () {
    it("Should set correct token properties", async function () {
      expect(await wrappedDoichain.name()).to.equal("Wrapped Doichain");
      expect(await wrappedDoichain.symbol()).to.equal("wDOI");
      expect(await wrappedDoichain.decimals()).to.equal(18);
      expect(await wrappedDoichain.totalSupply()).to.equal(0);
      expect(await wrappedDoichain.requiredConfirmations()).to.equal(2);
    });

    it("Should assign admin roles", async function () {
      expect(await wrappedDoichain.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await wrappedDoichain.hasRole(PAUSER_ROLE, admin.address)).to.be.true;
      expect(await wrappedDoichain.hasRole(RESERVE_MANAGER_ROLE, admin.address)).to.be.true;
    });
  });

  describe("Custodian Management", function () {
    it("Should allow admin to add custodian", async function () {
      await expect(wrappedDoichain.connect(admin).addCustodian(
        custodian1.address,
        "Custodian One",
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      ))
        .to.emit(wrappedDoichain, "CustodianAdded")
        .withArgs(custodian1.address, "Custodian One", "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm");

      expect(await wrappedDoichain.hasRole(CUSTODIAN_ROLE, custodian1.address)).to.be.true;
      
      const custodianInfo = await wrappedDoichain.getCustodianInfo(custodian1.address);
      expect(custodianInfo.name).to.equal("Custodian One");
      expect(custodianInfo.active).to.be.true;
    });

    it("Should not allow non-admin to add custodian", async function () {
      await expect(wrappedDoichain.connect(nonAuthorized).addCustodian(
        custodian1.address,
        "Custodian One",
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      )).to.be.revertedWithCustomError(wrappedDoichain, "AccessControlUnauthorizedAccount");
    });

    it("Should allow admin to remove custodian", async function () {
      // First add custodian
      await wrappedDoichain.connect(admin).addCustodian(
        custodian1.address,
        "Custodian One",
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      );

      // Then remove custodian
      await expect(wrappedDoichain.connect(admin).removeCustodian(custodian1.address))
        .to.emit(wrappedDoichain, "CustodianRemoved")
        .withArgs(custodian1.address);

      expect(await wrappedDoichain.hasRole(CUSTODIAN_ROLE, custodian1.address)).to.be.false;
      
      const custodianInfo = await wrappedDoichain.getCustodianInfo(custodian1.address);
      expect(custodianInfo.active).to.be.false;
    });

    it("Should allow reserve manager to update custodian reserves", async function () {
      // Add custodian
      await wrappedDoichain.connect(admin).addCustodian(
        custodian1.address,
        "Custodian One",
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      );

      const reserveAmount = ethers.parseEther("1000");
      
      await expect(wrappedDoichain.connect(admin).updateCustodianReserves(
        custodian1.address,
        reserveAmount
      ))
        .to.emit(wrappedDoichain, "CustodianReservesUpdated")
        .withArgs(custodian1.address, reserveAmount);

      const custodianInfo = await wrappedDoichain.getCustodianInfo(custodian1.address);
      expect(custodianInfo.reserveAmount).to.equal(reserveAmount);
      expect(await wrappedDoichain.totalReserves()).to.equal(reserveAmount);
    });
  });

  describe("Merchant Management", function () {
    it("Should allow admin to add merchant", async function () {
      await wrappedDoichain.connect(admin).addMerchant(merchant1.address);
      expect(await wrappedDoichain.hasRole(MERCHANT_ROLE, merchant1.address)).to.be.true;
    });

    it("Should allow admin to remove merchant", async function () {
      await wrappedDoichain.connect(admin).addMerchant(merchant1.address);
      await wrappedDoichain.connect(admin).removeMerchant(merchant1.address);
      expect(await wrappedDoichain.hasRole(MERCHANT_ROLE, merchant1.address)).to.be.false;
    });
  });

  describe("Mint Process", function () {
    const mintAmount = ethers.parseEther("100");
    const doichainTxHash = "tx_hash_123";

    beforeEach(async function () {
      // Setup: add custodians and merchant
      await wrappedDoichain.connect(admin).addCustodian(
        custodian1.address,
        "Custodian One",
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      );
      
      await wrappedDoichain.connect(admin).addCustodian(
        custodian2.address,
        "Custodian Two",
        "DKb2NsF8e6G9pQ3dR5L7V8s9X1zT4nKcWx"
      );
      
      await wrappedDoichain.connect(admin).addMerchant(merchant1.address);
    });

    it("Should allow merchant to request mint", async function () {
      await expect(wrappedDoichain.connect(merchant1).requestMint(
        user1.address,
        mintAmount,
        doichainTxHash,
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      ))
        .to.emit(wrappedDoichain, "MintRequested")
        .withArgs(1, user1.address, mintAmount, doichainTxHash, merchant1.address);

      const request = await wrappedDoichain.mintRequests(1);
      expect(request.recipient).to.equal(user1.address);
      expect(request.amount).to.equal(mintAmount);
      expect(request.executed).to.be.false;
      expect(request.confirmations).to.equal(0);
    });

    it("Should not allow non-merchant to request mint", async function () {
      await expect(wrappedDoichain.connect(nonAuthorized).requestMint(
        user1.address,
        mintAmount,
        doichainTxHash,
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      )).to.be.revertedWithCustomError(wrappedDoichain, "AccessControlUnauthorizedAccount");
    });

    it("Should allow custodians to confirm mint", async function () {
      // Request mint
      await wrappedDoichain.connect(merchant1).requestMint(
        user1.address,
        mintAmount,
        doichainTxHash,
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      );

      // First confirmation
      await expect(wrappedDoichain.connect(custodian1).confirmMint(1))
        .to.emit(wrappedDoichain, "MintConfirmed")
        .withArgs(1, custodian1.address, 1);

      let request = await wrappedDoichain.mintRequests(1);
      expect(request.confirmations).to.equal(1);
      expect(request.executed).to.be.false;

      // Second confirmation - should execute automatically
      await expect(wrappedDoichain.connect(custodian2).confirmMint(1))
        .to.emit(wrappedDoichain, "MintConfirmed")
        .withArgs(1, custodian2.address, 2)
        .and.to.emit(wrappedDoichain, "MintExecuted")
        .withArgs(1, user1.address, mintAmount);

      request = await wrappedDoichain.mintRequests(1);
      expect(request.executed).to.be.true;
      expect(request.approved).to.be.true;
      expect(await wrappedDoichain.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should not allow duplicate confirmations", async function () {
      await wrappedDoichain.connect(merchant1).requestMint(
        user1.address,
        mintAmount,
        doichainTxHash,
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      );

      await wrappedDoichain.connect(custodian1).confirmMint(1);
      
      await expect(wrappedDoichain.connect(custodian1).confirmMint(1))
        .to.be.revertedWith("Already confirmed");
    });

    it("Should not allow processing duplicate doichain transactions", async function () {
      await wrappedDoichain.connect(merchant1).requestMint(
        user1.address,
        mintAmount,
        doichainTxHash,
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      );

      await expect(wrappedDoichain.connect(merchant1).requestMint(
        user2.address,
        mintAmount,
        doichainTxHash, // Same hash
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      )).to.be.revertedWith("Transaction already processed");
    });
  });

  describe("Burn Process", function () {
    const mintAmount = ethers.parseEther("100");
    const burnAmount = ethers.parseEther("50");
    const doichainTxHash = "tx_hash_123";
    const withdrawAddress = "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm";

    beforeEach(async function () {
      // Setup: add custodians and merchant
      await wrappedDoichain.connect(admin).addCustodian(
        custodian1.address,
        "Custodian One",
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      );
      
      await wrappedDoichain.connect(admin).addCustodian(
        custodian2.address,
        "Custodian Two",
        "DKb2NsF8e6G9pQ3dR5L7V8s9X1zT4nKcWx"
      );
      
      await wrappedDoichain.connect(admin).addMerchant(merchant1.address);

      // Mint tokens for burn testing
      await wrappedDoichain.connect(merchant1).requestMint(
        user1.address,
        mintAmount,
        doichainTxHash,
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      );
      
      await wrappedDoichain.connect(custodian1).confirmMint(1);
      await wrappedDoichain.connect(custodian2).confirmMint(1);
    });

    it("Should allow merchant to request burn", async function () {
      await expect(wrappedDoichain.connect(merchant1).requestBurn(
        user1.address,
        burnAmount,
        withdrawAddress
      ))
        .to.emit(wrappedDoichain, "BurnRequested")
        .withArgs(1, user1.address, burnAmount, withdrawAddress, merchant1.address);

      const request = await wrappedDoichain.burnRequests(1);
      expect(request.account).to.equal(user1.address);
      expect(request.amount).to.equal(burnAmount);
      expect(request.executed).to.be.false;
      expect(request.confirmations).to.equal(0);
    });

    it("Should allow custodians to confirm burn and execute", async function () {
      // Request burn
      await wrappedDoichain.connect(merchant1).requestBurn(
        user1.address,
        burnAmount,
        withdrawAddress
      );

      const initialBalance = await wrappedDoichain.balanceOf(user1.address);

      // First confirmation
      await expect(wrappedDoichain.connect(custodian1).confirmBurn(1))
        .to.emit(wrappedDoichain, "BurnConfirmed")
        .withArgs(1, custodian1.address, 1);

      // Second confirmation - should execute automatically
      await expect(wrappedDoichain.connect(custodian2).confirmBurn(1))
        .to.emit(wrappedDoichain, "BurnConfirmed")
        .withArgs(1, custodian2.address, 2)
        .and.to.emit(wrappedDoichain, "BurnExecuted")
        .withArgs(1, user1.address, burnAmount);

      const request = await wrappedDoichain.burnRequests(1);
      expect(request.executed).to.be.true;
      expect(request.approved).to.be.true;
      
      const finalBalance = await wrappedDoichain.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance - burnAmount);
    });

    it("Should not allow burn with insufficient balance", async function () {
      const excessiveAmount = ethers.parseEther("200");
      
      await expect(wrappedDoichain.connect(merchant1).requestBurn(
        user1.address,
        excessiveAmount,
        withdrawAddress
      )).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Proof of Reserves", function () {
    it("Should track reserves correctly", async function () {
      // Add custodians
      await wrappedDoichain.connect(admin).addCustodian(
        custodian1.address,
        "Custodian One",
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      );

      // Update reserves
      const reserveAmount = ethers.parseEther("1000");
      await wrappedDoichain.connect(admin).updateCustodianReserves(
        custodian1.address,
        reserveAmount
      );

      const reservesInfo = await wrappedDoichain.getReservesInfo();
      expect(reservesInfo.totalReservesAmount).to.equal(reserveAmount);
      expect(reservesInfo.totalSupplyAmount).to.equal(0);
      expect(reservesInfo.isFullyBacked).to.be.true;
    });

    it("Should show if not fully backed", async function () {
      // Add custodians and merchant
      await wrappedDoichain.connect(admin).addCustodian(
        custodian1.address,
        "Custodian One",
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      );
      
      await wrappedDoichain.connect(admin).addCustodian(
        custodian2.address,
        "Custodian Two",
        "DKb2NsF8e6G9pQ3dR5L7V8s9X1zT4nKcWx"
      );
      
      await wrappedDoichain.connect(admin).addMerchant(merchant1.address);

      // Mint tokens
      const mintAmount = ethers.parseEther("100");
      await wrappedDoichain.connect(merchant1).requestMint(
        user1.address,
        mintAmount,
        "tx_hash_123",
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      );
      
      await wrappedDoichain.connect(custodian1).confirmMint(1);
      await wrappedDoichain.connect(custodian2).confirmMint(1);

      // Set reserves less than supply
      await wrappedDoichain.connect(admin).updateCustodianReserves(
        custodian1.address,
        ethers.parseEther("50")
      );

      const reservesInfo = await wrappedDoichain.getReservesInfo();
      expect(reservesInfo.totalSupplyAmount).to.equal(mintAmount);
      expect(reservesInfo.totalReservesAmount).to.equal(ethers.parseEther("50"));
      expect(reservesInfo.isFullyBacked).to.be.false;
    });
  });

  describe("Administrative Functions", function () {
    it("Should allow admin to change required confirmations", async function () {
      await wrappedDoichain.connect(admin).setRequiredConfirmations(3);
      expect(await wrappedDoichain.requiredConfirmations()).to.equal(3);
    });

    it("Should not allow setting zero confirmations", async function () {
      await expect(wrappedDoichain.connect(admin).setRequiredConfirmations(0))
        .to.be.revertedWith("Invalid confirmations requirement");
    });

    it("Should allow pausing and unpausing", async function () {
      await wrappedDoichain.connect(admin).pause();
      expect(await wrappedDoichain.paused()).to.be.true;

      // Add merchant for test
      await wrappedDoichain.connect(admin).addMerchant(merchant1.address);

      // Check that mint is blocked
      await expect(wrappedDoichain.connect(merchant1).requestMint(
        user1.address,
        ethers.parseEther("100"),
        "tx_hash_123",
        "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
      )).to.be.revertedWithCustomError(wrappedDoichain, "EnforcedPause");

      await wrappedDoichain.connect(admin).unpause();
      expect(await wrappedDoichain.paused()).to.be.false;
    });
  });
});