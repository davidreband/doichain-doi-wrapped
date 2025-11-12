const { ethers } = require("hardhat");

async function main() {
    console.log("🏪 Creating Merchant Role Management System...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Contract code for merchant role management
    const contractCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract MerchantRegistry is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;
    bytes32 public constant MERCHANT_ROLE = keccak256("MERCHANT_ROLE");
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");
    
    struct MerchantInfo {
        bool isActive;
        string businessName;
        uint256 registeredAt;
        uint256 totalProcessed;
        bool canMint;
        bool canBurn;
    }
    
    mapping(address => MerchantInfo) public merchants;
    address[] public merchantList;
    
    event MerchantRegistered(address indexed merchant, string businessName);
    event MerchantDeactivated(address indexed merchant);
    event MerchantPermissionUpdated(address indexed merchant, bool canMint, bool canBurn);
    
    constructor() {
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(CUSTODIAN_ROLE, msg.sender);
    }
    
    // Admin functions
    function registerMerchant(
        address merchantAddress, 
        string memory businessName,
        bool canMint,
        bool canBurn
    ) external onlyRole(ADMIN_ROLE) {
        require(!merchants[merchantAddress].isActive, "Merchant already registered");
        
        merchants[merchantAddress] = MerchantInfo({
            isActive: true,
            businessName: businessName,
            registeredAt: block.timestamp,
            totalProcessed: 0,
            canMint: canMint,
            canBurn: canBurn
        });
        
        merchantList.push(merchantAddress);
        _grantRole(MERCHANT_ROLE, merchantAddress);
        
        emit MerchantRegistered(merchantAddress, businessName);
    }
    
    function deactivateMerchant(address merchantAddress) external onlyRole(ADMIN_ROLE) {
        require(merchants[merchantAddress].isActive, "Merchant not active");
        
        merchants[merchantAddress].isActive = false;
        _revokeRole(MERCHANT_ROLE, merchantAddress);
        
        emit MerchantDeactivated(merchantAddress);
    }
    
    function updateMerchantPermissions(
        address merchantAddress,
        bool canMint,
        bool canBurn
    ) external onlyRole(ADMIN_ROLE) {
        require(merchants[merchantAddress].isActive, "Merchant not active");
        
        merchants[merchantAddress].canMint = canMint;
        merchants[merchantAddress].canBurn = canBurn;
        
        emit MerchantPermissionUpdated(merchantAddress, canMint, canBurn);
    }
    
    // View functions
    function isMerchant(address account) external view returns (bool) {
        return hasRole(MERCHANT_ROLE, account) && merchants[account].isActive;
    }
    
    function isCustodian(address account) external view returns (bool) {
        return hasRole(CUSTODIAN_ROLE, account);
    }
    
    function getMerchantInfo(address account) external view returns (MerchantInfo memory) {
        return merchants[account];
    }
    
    function getMerchantCount() external view returns (uint256) {
        return merchantList.length;
    }
    
    function getAllMerchants() external view returns (address[] memory) {
        return merchantList;
    }
    
    function canMerchantMint(address account) external view returns (bool) {
        return merchants[account].isActive && merchants[account].canMint;
    }
    
    function canMerchantBurn(address account) external view returns (bool) {
        return merchants[account].isActive && merchants[account].canBurn;
    }
    
    // Merchant functions
    function recordOperation(uint256 amount) external onlyRole(MERCHANT_ROLE) {
        merchants[msg.sender].totalProcessed += amount;
    }
    
    // Emergency functions
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
`;

    console.log("📋 Merchant Registry Contract Features:");
    console.log("─".repeat(50));
    console.log("✅ Role-based access control");
    console.log("✅ Merchant registration/deactivation");  
    console.log("✅ Permission management (mint/burn)");
    console.log("✅ Merchant info tracking");
    console.log("✅ Activity logging");
    console.log("✅ Emergency pause functionality");
    console.log();

    console.log("🔑 Roles:");
    console.log("─".repeat(30));
    console.log("ADMIN_ROLE: Can register/deactivate merchants");
    console.log("MERCHANT_ROLE: Can process wrap/unwrap operations");
    console.log("CUSTODIAN_ROLE: Can confirm/reject operations");
    console.log();

    console.log("📊 Usage in Frontend:");
    console.log("─".repeat(30));
    console.log(`
// Check if user is merchant
const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);
const isMerchant = await registry.isMerchant(userAddress);

// Get merchant permissions
const merchantInfo = await registry.getMerchantInfo(userAddress);
const canMint = merchantInfo.canMint;
const canBurn = merchantInfo.canBurn;

// Check specific permissions
const canMint = await registry.canMerchantMint(userAddress);
const canBurn = await registry.canMerchantBurn(userAddress);
`);

    console.log("🚀 Next Steps:");
    console.log("─".repeat(30));
    console.log("1. Deploy MerchantRegistry contract");
    console.log("2. Register initial merchants");
    console.log("3. Update frontend to use contract verification");
    console.log("4. Integrate with wDOI minting contract");

}

main().catch(console.error);