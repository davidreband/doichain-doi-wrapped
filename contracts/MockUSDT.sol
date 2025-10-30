// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @dev Mock USDT token for testing purposes
 * Uses 6 decimals like real USDT
 */
contract MockUSDT is ERC20, Ownable {
    
    constructor() ERC20("Mock USDT", "USDT") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10**6); // 1 million USDT with 6 decimals
    }
    
    /**
     * @dev Override decimals to match real USDT (6 decimals)
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    /**
     * @dev Mint tokens for testing
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Faucet function for easy testing
     */
    function faucet(address to, uint256 amount) external {
        require(amount <= 10000 * 10**6, "Max 10,000 USDT per faucet");
        _mint(to, amount);
    }
}