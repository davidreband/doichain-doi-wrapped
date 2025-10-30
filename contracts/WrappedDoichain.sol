// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title WrappedDoichain
 * @dev Wrapped Doichain (wDOI) token - representation of DOI tokens in Ethereum network
 * 
 * Features:
 * - Mint: create wDOI when depositing DOI through bridge
 * - Burn: destroy wDOI when withdrawing DOI back to Doichain
 * - Access roles: only authorized bridges can mint/burn
 * - Pause: stop operations in emergency cases
 */
contract WrappedDoichain is ERC20, AccessControl, Pausable, ERC20Burnable {
    
    // Access roles
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Events for tracking bridge operations
    event Deposit(
        address indexed user, 
        uint256 amount, 
        string doichainTxHash,
        address indexed bridge
    );
    
    event Withdrawal(
        address indexed user, 
        uint256 amount, 
        string doichainAddress,
        address indexed bridge
    );
    
    event BridgeAdded(address indexed bridge);
    event BridgeRemoved(address indexed bridge);
    
    // Mapping for tracking processed deposits
    mapping(string => bool) public processedDeposits;
    
    // Statistics
    uint256 public totalDeposited;
    uint256 public totalWithdrawn;
    
    constructor(
        address admin,
        address[] memory initialBridges
    ) ERC20("Wrapped Doichain", "wDOI") {
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        
        // Add initial bridges
        for (uint256 i = 0; i < initialBridges.length; i++) {
            _grantRole(BRIDGE_ROLE, initialBridges[i]);
            emit BridgeAdded(initialBridges[i]);
        }
    }
    
    /**
     * @dev Create wDOI tokens when depositing DOI
     * @param user Address of wDOI recipient
     * @param amount Amount of wDOI to create
     * @param doichainTxHash Transaction hash in Doichain network
     */
    function deposit(
        address user,
        uint256 amount,
        string memory doichainTxHash
    ) external onlyRole(BRIDGE_ROLE) whenNotPaused {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        require(!processedDeposits[doichainTxHash], "Deposit already processed");
        
        // Mark deposit as processed
        processedDeposits[doichainTxHash] = true;
        
        // Create tokens
        _mint(user, amount);
        
        // Update statistics
        totalDeposited += amount;
        
        emit Deposit(user, amount, doichainTxHash, msg.sender);
    }
    
    /**
     * @dev Burn wDOI tokens when withdrawing DOI
     * @param user Address of wDOI owner
     * @param amount Amount of wDOI to burn
     * @param doichainAddress Address in Doichain network to receive DOI
     */
    function withdraw(
        address user,
        uint256 amount,
        string memory doichainAddress
    ) external onlyRole(BRIDGE_ROLE) whenNotPaused {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(doichainAddress).length > 0, "Invalid Doichain address");
        require(balanceOf(user) >= amount, "Insufficient balance");
        
        // Burn tokens
        _burn(user, amount);
        
        // Update statistics
        totalWithdrawn += amount;
        
        emit Withdrawal(user, amount, doichainAddress, msg.sender);
    }
    
    /**
     * @dev Add new bridge
     */
    function addBridge(address bridge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bridge != address(0), "Invalid bridge address");
        _grantRole(BRIDGE_ROLE, bridge);
        emit BridgeAdded(bridge);
    }
    
    /**
     * @dev Remove bridge
     */
    function removeBridge(address bridge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(BRIDGE_ROLE, bridge);
        emit BridgeRemoved(bridge);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Get token information
     */
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply,
        uint256 tokenTotalDeposited,
        uint256 tokenTotalWithdrawn,
        bool isPaused
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            totalDeposited,
            totalWithdrawn,
            paused()
        );
    }
    
    /**
     * @dev Check bridge role
     */
    function isBridge(address account) external view returns (bool) {
        return hasRole(BRIDGE_ROLE, account);
    }
    
    // Override functions to support pause
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }
    
    // Interface support
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}