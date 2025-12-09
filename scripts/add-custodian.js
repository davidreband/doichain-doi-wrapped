const { ethers } = require("hardhat");

async function main() {
    // Get the contract address from deployment file
    const deploymentFile = require('../deployments/sepolia-v2-deployment.json');
    const contractAddress = deploymentFile.WDOI_TOKEN_V3;
    
    // New custodian address to add
    const NEW_CUSTODIAN_ADDRESS = "0x..."; // REPLACE WITH ACTUAL ADDRESS
    
    console.log("Adding custodian to wDOI contract...");
    console.log("Contract address:", contractAddress);
    console.log("New custodian address:", NEW_CUSTODIAN_ADDRESS);
    
    // Get contract instance
    const WrappedDoichain = await ethers.getContractFactory("WrappedDoichainV2");
    const wdoi = WrappedDoichain.attach(contractAddress);
    
    // Get current signer (must be admin)
    const [admin] = await ethers.getSigners();
    console.log("Admin address:", admin.address);
    
    try {
        // Check if admin has the required role
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const hasAdminRole = await wdoi.hasRole(DEFAULT_ADMIN_ROLE, admin.address);
        
        if (!hasAdminRole) {
            throw new Error("Current signer does not have admin role");
        }
        
        // Check if address is already a custodian
        const CUSTODIAN_ROLE = await wdoi.CUSTODIAN_ROLE();
        const isAlreadyCustodian = await wdoi.hasRole(CUSTODIAN_ROLE, NEW_CUSTODIAN_ADDRESS);
        
        if (isAlreadyCustodian) {
            console.log("✅ Address is already a custodian");
            return;
        }
        
        // Add custodian
        console.log("\n🔄 Adding custodian...");
        const tx = await wdoi.addCustodian(NEW_CUSTODIAN_ADDRESS);
        
        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Custodian added successfully!");
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Verify the role was granted
        const isNowCustodian = await wdoi.hasRole(CUSTODIAN_ROLE, NEW_CUSTODIAN_ADDRESS);
        console.log("✅ Verification: Is custodian?", isNowCustodian);
        
        // Check event
        const addedEvent = receipt.logs.find(log => {
            try {
                const parsed = wdoi.interface.parseLog(log);
                return parsed.name === 'CustodianAdded';
            } catch {
                return false;
            }
        });
        
        if (addedEvent) {
            const parsed = wdoi.interface.parseLog(addedEvent);
            console.log("📧 Event emitted:", {
                custodian: parsed.args.custodian,
                admin: parsed.args.admin
            });
        }
        
    } catch (error) {
        console.error("❌ Error adding custodian:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });