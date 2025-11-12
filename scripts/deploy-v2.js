const { ethers, upgrades, run, network } = require('hardhat');

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

    // Deploy the upgradeable WrappedDoichain contract
    const WrappedDoichain = await ethers.getContractFactory("WrappedDoichainV2");
    
    console.log("Deploying WrappedDoichain proxy...");
    const wdoi = await upgrades.deployProxy(WrappedDoichain, [
        deployer.address, // admin
        "Wrapped Doichain",
        "wDOI"
    ], { 
        initializer: 'initialize',
        kind: 'uups'
    });

    await wdoi.waitForDeployment();
    
    console.log("WrappedDoichain proxy deployed to:", await wdoi.getAddress());
    
    // Get the implementation address
    const proxyAddress = await wdoi.getAddress();
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("Implementation deployed to:", implementationAddress);

    // Add initial custodian and merchant roles
    console.log("Setting up initial roles...");
    
    // Add deployer as custodian for testing
    const custodianTx = await wdoi.addCustodian(deployer.address);
    await custodianTx.wait();
    console.log("Added deployer as custodian");

    // Add merchant from environment variables
    const merchantAddress = process.env.MERCHANT_ADDRESS || deployer.address;
    const merchantTx = await wdoi.addMerchant(merchantAddress);
    await merchantTx.wait();
    console.log("Added merchant:", merchantAddress);

    // Verify contract on Etherscan (if not local network)
    if (network.name !== "hardhat" && network.name !== "localhost") {
        console.log("Waiting for block confirmations...");
        // Wait for blocks manually
        const currentBlock = await ethers.provider.getBlockNumber();
        console.log("Current block:", currentBlock);
        
        console.log("Verifying contract on Etherscan...");
        try {
            await run("verify:verify", {
                address: implementationAddress,
                constructorArguments: [],
            });
        } catch (error) {
            if (error.message.toLowerCase().includes("already verified")) {
                console.log("Contract already verified");
            } else {
                console.error("Verification failed:", error);
            }
        }
    }

    console.log("\n=== Deployment Summary ===");
    console.log("Proxy Address:", proxyAddress);
    console.log("Implementation Address:", implementationAddress);
    console.log("Admin:", deployer.address);
    console.log("Initial Custodian:", deployer.address);
    console.log("Initial Merchant:", merchantAddress);
    
    // Save deployment info
    const fs = require('fs');
    const deploymentInfo = {
        network: network.name,
        proxy: proxyAddress,
        implementation: implementationAddress,
        admin: deployer.address,
        custodian: deployer.address,
        merchant: merchantAddress,
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber()
    };
    
    fs.writeFileSync(
        `deployments/${network.name}-deployment.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log(`Deployment info saved to deployments/${network.name}-deployment.json`);

    // Test basic functionality
    console.log("\n=== Testing Basic Functionality ===");
    
    // Check roles
    const hasAdminRole = await wdoi.hasRole(await wdoi.DEFAULT_ADMIN_ROLE(), deployer.address);
    const hasCustodianRole = await wdoi.hasRole(await wdoi.CUSTODIAN_ROLE(), deployer.address);
    const hasMerchantRole = await wdoi.hasRole(await wdoi.MERCHANT_ROLE(), merchantAddress);
    
    console.log("Admin role check:", hasAdminRole);
    console.log("Custodian role check:", hasCustodianRole);
    console.log("Merchant role check:", hasMerchantRole);
    
    // Check initial state
    console.log("Total supply:", await wdoi.totalSupply());
    console.log("Total reserves:", await wdoi.totalReserves());
    console.log("Backing ratio:", await wdoi.getBackingRatio());
    
    console.log("\n=== Next Steps ===");
    console.log("1. Update frontend configuration with new contract address");
    console.log("2. Test minting with a DOI transaction hash");
    console.log("3. Add additional custodians and merchants as needed");
    console.log("4. Set up backend API to interact with the contract");
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });