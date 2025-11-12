// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title WrappedDoichain (wDOI)
 * @dev ERC20 token representing wrapped Doichain tokens following the WBTC model
 * 
 * Features:
 * - Role-based access control for custodians and merchants
 * - Mint/burn operations with DOI transaction references
 * - Upgradeable proxy pattern for future improvements
 * - Pausable for emergency situations
 * - Events for all operations for transparency
 */
contract WrappedDoichainV2 is 
    Initializable,
    ERC20Upgradeable, 
    AccessControlUpgradeable, 
    PausableUpgradeable,
    UUPSUpgradeable 
{
    // Roles
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");
    bytes32 public constant MERCHANT_ROLE = keccak256("MERCHANT_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Events
    event Mint(
        address indexed to,
        uint256 amount,
        string indexed doiTxHash,
        address indexed custodian
    );
    
    event Burn(
        address indexed from,
        uint256 amount,
        string indexed doiAddress,
        address indexed initiator
    );
    
    event MerchantAdded(address indexed merchant, address indexed admin);
    event MerchantRemoved(address indexed merchant, address indexed admin);
    event CustodianAdded(address indexed custodian, address indexed admin);
    event CustodianRemoved(address indexed custodian, address indexed admin);
    
    // Security events
    event EmergencyModeEnabled(address indexed admin, string reason);
    event EmergencyModeDisabled(address indexed admin);
    event DailyLimitUpdated(uint256 oldLimit, uint256 newLimit, address indexed admin);
    event LargeMint(address indexed to, uint256 amount, string indexed doiTxHash, address indexed custodian);

    // Mappings for tracking operations
    mapping(string => bool) public processedDoiTxHashes;
    mapping(address => uint256) public totalMintedBy;
    mapping(address => uint256) public totalBurnedBy;

    // Reserve tracking
    uint256 public totalReserves;
    
    // Security limits for production
    uint256 public constant MAX_MINT_AMOUNT = 10000 * 1e18; // Max 10,000 wDOI per mint
    uint256 public dailyMintLimit; // Daily limit: will be set in initializer
    mapping(uint256 => uint256) public dailyMintedAmount; // day => amount
    
    // Emergency controls
    bool public emergencyMode; // Will be set in initializer
    uint256 public lastEmergencyMode;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract (replaces constructor for upgradeable contracts)
     * @param admin Address that will have admin privileges
     * @param name Token name
     * @param symbol Token symbol
     */
    function initialize(
        address admin,
        string memory name,
        string memory symbol
    ) public initializer {
        __ERC20_init(name, symbol);
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        // Grant admin role
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        
        // Initialize security settings
        dailyMintLimit = 50000 * 1e18; // 50,000 wDOI daily limit
        emergencyMode = false; // Not in emergency mode by default
    }

    /**
     * @dev Mint new wDOI tokens backed by DOI deposits
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint (in wei units)
     * @param doiTxHash Doichain transaction hash proving DOI deposit
     */
    function mint(
        address to,
        uint256 amount,
        string calldata doiTxHash
    ) external onlyRole(CUSTODIAN_ROLE) whenNotPaused {
        require(!emergencyMode, "WrappedDoichainV2: emergency mode active");
        require(to != address(0), "WrappedDoichainV2: mint to zero address");
        require(amount > 0, "WrappedDoichainV2: mint amount must be positive");
        require(amount <= MAX_MINT_AMOUNT, "WrappedDoichainV2: amount exceeds max mint");
        require(bytes(doiTxHash).length > 0, "WrappedDoichainV2: DOI tx hash required");
        require(!processedDoiTxHashes[doiTxHash], "WrappedDoichainV2: DOI tx already processed");

        // Check daily limits
        uint256 today = block.timestamp / 86400; // Current day
        require(
            dailyMintedAmount[today] + amount <= dailyMintLimit,
            "WrappedDoichainV2: daily mint limit exceeded"
        );

        // Mark DOI transaction as processed
        processedDoiTxHashes[doiTxHash] = true;
        
        // Update tracking
        totalMintedBy[to] += amount;
        totalReserves += amount;
        dailyMintedAmount[today] += amount;

        // Mint tokens
        _mint(to, amount);

        emit Mint(to, amount, doiTxHash, msg.sender);
        
        // Emit large mint event for monitoring
        if (amount >= MAX_MINT_AMOUNT / 2) { // Alert for mints >= 5,000 wDOI
            emit LargeMint(to, amount, doiTxHash, msg.sender);
        }
    }

    /**
     * @dev Burn wDOI tokens to redeem DOI
     * @param amount Amount of tokens to burn
     * @param doiAddress Doichain address to receive the DOI
     */
    function burn(uint256 amount, string calldata doiAddress) external whenNotPaused {
        require(amount > 0, "WrappedDoichainV2: burn amount must be positive");
        require(bytes(doiAddress).length > 0, "WrappedDoichainV2: DOI address required");
        require(balanceOf(msg.sender) >= amount, "WrappedDoichainV2: insufficient balance");

        // Update tracking
        totalBurnedBy[msg.sender] += amount;
        totalReserves -= amount;

        // Burn tokens
        _burn(msg.sender, amount);

        emit Burn(msg.sender, amount, doiAddress, msg.sender);
    }

    /**
     * @dev Burn tokens on behalf of another account (requires approval)
     * @param from Address to burn tokens from
     * @param amount Amount to burn
     * @param doiAddress Doichain address for DOI redemption
     */
    function burnFrom(
        address from,
        uint256 amount,
        string calldata doiAddress
    ) external whenNotPaused {
        require(amount > 0, "WrappedDoichain: burn amount must be positive");
        require(bytes(doiAddress).length > 0, "WrappedDoichain: DOI address required");

        // Check and update allowance
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "WrappedDoichain: insufficient allowance");
        _approve(from, msg.sender, currentAllowance - amount);

        // Update tracking
        totalBurnedBy[from] += amount;
        totalReserves -= amount;

        // Burn tokens
        _burn(from, amount);

        emit Burn(from, amount, doiAddress, msg.sender);
    }

    /**
     * @dev Add a new merchant
     * @param merchant Address to grant merchant role
     */
    function addMerchant(address merchant) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(merchant != address(0), "WrappedDoichain: merchant cannot be zero address");
        _grantRole(MERCHANT_ROLE, merchant);
        emit MerchantAdded(merchant, msg.sender);
    }

    /**
     * @dev Remove a merchant
     * @param merchant Address to revoke merchant role from
     */
    function removeMerchant(address merchant) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MERCHANT_ROLE, merchant);
        emit MerchantRemoved(merchant, msg.sender);
    }

    /**
     * @dev Add a new custodian
     * @param custodian Address to grant custodian role
     */
    function addCustodian(address custodian) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(custodian != address(0), "WrappedDoichain: custodian cannot be zero address");
        _grantRole(CUSTODIAN_ROLE, custodian);
        emit CustodianAdded(custodian, msg.sender);
    }

    /**
     * @dev Remove a custodian
     * @param custodian Address to revoke custodian role from
     */
    function removeCustodian(address custodian) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(CUSTODIAN_ROLE, custodian);
        emit CustodianRemoved(custodian, msg.sender);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Get reserve backing ratio (returns ratio * 1e18 for precision)
     */
    function getBackingRatio() external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 1e18; // 100% when no tokens issued
        return (totalReserves * 1e18) / supply;
    }

    /**
     * @dev Check if a DOI transaction has been processed
     * @param doiTxHash Doichain transaction hash
     */
    function isDoiTxProcessed(string calldata doiTxHash) external view returns (bool) {
        return processedDoiTxHashes[doiTxHash];
    }

    /**
     * @dev Get total tokens minted by an address
     * @param account Address to check
     */
    function getTotalMinted(address account) external view returns (uint256) {
        return totalMintedBy[account];
    }

    /**
     * @dev Get total tokens burned by an address
     * @param account Address to check
     */
    function getTotalBurned(address account) external view returns (uint256) {
        return totalBurnedBy[account];
    }

    /**
     * @dev Override to prevent transfers when paused
     */
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }

    /**
     * @dev Enable emergency mode - stops all minting
     * @param reason Reason for enabling emergency mode
     */
    function enableEmergencyMode(string calldata reason) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emergencyMode = true;
        lastEmergencyMode = block.timestamp;
        emit EmergencyModeEnabled(msg.sender, reason);
    }

    /**
     * @dev Disable emergency mode - allows minting again
     */
    function disableEmergencyMode() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(emergencyMode, "WrappedDoichainV2: emergency mode not active");
        emergencyMode = false;
        emit EmergencyModeDisabled(msg.sender);
    }

    /**
     * @dev Update daily mint limit
     * @param newLimit New daily limit in wei
     */
    function updateDailyMintLimit(uint256 newLimit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newLimit > 0, "WrappedDoichainV2: limit must be positive");
        uint256 oldLimit = dailyMintLimit;
        dailyMintLimit = newLimit;
        emit DailyLimitUpdated(oldLimit, newLimit, msg.sender);
    }

    /**
     * @dev Get today's remaining mint capacity
     */
    function getTodayMintCapacity() external view returns (uint256) {
        uint256 today = block.timestamp / 86400;
        uint256 todayMinted = dailyMintedAmount[today];
        if (todayMinted >= dailyMintLimit) {
            return 0;
        }
        return dailyMintLimit - todayMinted;
    }

    /**
     * @dev Get today's minted amount
     */
    function getTodayMintedAmount() external view returns (uint256) {
        uint256 today = block.timestamp / 86400;
        return dailyMintedAmount[today];
    }

    /**
     * @dev Required by UUPSUpgradeable
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @dev Support for ERC165
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(AccessControlUpgradeable) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}