// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title WrappedDoichainCustodial
 * @dev Custodial version of Wrapped Doichain based on WBTC model
 * 
 * Architecture:
 * - Custodians: manage cold wallets with DOI tokens
 * - Merchants: initiate mint/burn requests
 * - Multisig: critical operations require confirmation
 * - Proof of Reserves: public proof of reserves
 */
contract WrappedDoichainCustodial is ERC20, AccessControl, Pausable, ERC20Burnable {
    
    // Access roles
    bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");
    bytes32 public constant MERCHANT_ROLE = keccak256("MERCHANT_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant RESERVE_MANAGER_ROLE = keccak256("RESERVE_MANAGER_ROLE");
    
    // Structures for request management
    struct MintRequest {
        address recipient;
        uint256 amount;
        string doichainTxHash;
        string custodianAddress;
        address merchant;
        uint256 timestamp;
        bool approved;
        bool executed;
        uint256 confirmations;
    }
    
    struct BurnRequest {
        address account;
        uint256 amount;
        string doichainWithdrawAddress;
        address merchant;
        uint256 timestamp;
        bool approved;
        bool executed;
        uint256 confirmations;
    }
    
    struct CustodianInfo {
        string name;
        string doichainAddress;
        uint256 reserveAmount;
        bool active;
        uint256 addedTimestamp;
    }
    
    // Data storage
    mapping(uint256 => MintRequest) public mintRequests;
    mapping(uint256 => BurnRequest) public burnRequests;
    mapping(address => CustodianInfo) public custodians;
    mapping(uint256 => mapping(address => bool)) public mintConfirmations;
    mapping(uint256 => mapping(address => bool)) public burnConfirmations;
    mapping(string => bool) public processedDoichainTxs;
    
    // Counters and parameters
    uint256 public nextMintRequestId = 1;
    uint256 public nextBurnRequestId = 1;
    uint256 public requiredConfirmations = 2;
    uint256 public totalReserves;
    
    // Events
    event CustodianAdded(address indexed custodian, string name, string doichainAddress);
    event CustodianRemoved(address indexed custodian);
    event CustodianReservesUpdated(address indexed custodian, uint256 newAmount);
    
    event MintRequested(
        uint256 indexed requestId,
        address indexed recipient,
        uint256 amount,
        string doichainTxHash,
        address indexed merchant
    );
    
    event MintConfirmed(
        uint256 indexed requestId,
        address indexed custodian,
        uint256 confirmations
    );
    
    event MintExecuted(
        uint256 indexed requestId,
        address indexed recipient,
        uint256 amount
    );
    
    event BurnRequested(
        uint256 indexed requestId,
        address indexed account,
        uint256 amount,
        string doichainWithdrawAddress,
        address indexed merchant
    );
    
    event BurnConfirmed(
        uint256 indexed requestId,
        address indexed custodian,
        uint256 confirmations
    );
    
    event BurnExecuted(
        uint256 indexed requestId,
        address indexed account,
        uint256 amount
    );
    
    constructor(
        address admin,
        uint256 _requiredConfirmations
    ) ERC20("Wrapped Doichain", "wDOI") {
        require(_requiredConfirmations > 0, "Invalid confirmations requirement");
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(RESERVE_MANAGER_ROLE, admin);
        
        requiredConfirmations = _requiredConfirmations;
    }
    
    // === CUSTODIAN MANAGEMENT ===
    
    /**
     * @dev Add custodian
     */
    function addCustodian(
        address custodianAddress,
        string memory name,
        string memory doichainAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(custodianAddress != address(0), "Invalid custodian address");
        require(bytes(name).length > 0, "Name required");
        require(bytes(doichainAddress).length > 0, "Doichain address required");
        require(!custodians[custodianAddress].active, "Custodian already exists");
        
        custodians[custodianAddress] = CustodianInfo({
            name: name,
            doichainAddress: doichainAddress,
            reserveAmount: 0,
            active: true,
            addedTimestamp: block.timestamp
        });
        
        _grantRole(CUSTODIAN_ROLE, custodianAddress);
        emit CustodianAdded(custodianAddress, name, doichainAddress);
    }
    
    /**
     * @dev Remove custodian
     */
    function removeCustodian(address custodianAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(custodians[custodianAddress].active, "Custodian not found");
        
        custodians[custodianAddress].active = false;
        totalReserves -= custodians[custodianAddress].reserveAmount;
        
        _revokeRole(CUSTODIAN_ROLE, custodianAddress);
        emit CustodianRemoved(custodianAddress);
    }
    
    /**
     * @dev Update custodian reserves
     */
    function updateCustodianReserves(
        address custodianAddress,
        uint256 newAmount
    ) external onlyRole(RESERVE_MANAGER_ROLE) {
        require(custodians[custodianAddress].active, "Custodian not found");
        
        uint256 oldAmount = custodians[custodianAddress].reserveAmount;
        custodians[custodianAddress].reserveAmount = newAmount;
        
        if (newAmount > oldAmount) {
            totalReserves += (newAmount - oldAmount);
        } else {
            totalReserves -= (oldAmount - newAmount);
        }
        
        emit CustodianReservesUpdated(custodianAddress, newAmount);
    }
    
    // === MERCHANT OPERATIONS ===
    
    /**
     * @dev Add merchant
     */
    function addMerchant(address merchant) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MERCHANT_ROLE, merchant);
    }
    
    /**
     * @dev Remove merchant
     */
    function removeMerchant(address merchant) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MERCHANT_ROLE, merchant);
    }
    
    // === MINT PROCESS ===
    
    /**
     * @dev Request token creation (initiated by merchant)
     */
    function requestMint(
        address recipient,
        uint256 amount,
        string memory doichainTxHash,
        string memory custodianAddress
    ) external onlyRole(MERCHANT_ROLE) whenNotPaused returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(!processedDoichainTxs[doichainTxHash], "Transaction already processed");
        
        uint256 requestId = nextMintRequestId++;
        
        mintRequests[requestId] = MintRequest({
            recipient: recipient,
            amount: amount,
            doichainTxHash: doichainTxHash,
            custodianAddress: custodianAddress,
            merchant: msg.sender,
            timestamp: block.timestamp,
            approved: false,
            executed: false,
            confirmations: 0
        });
        
        processedDoichainTxs[doichainTxHash] = true;
        
        emit MintRequested(requestId, recipient, amount, doichainTxHash, msg.sender);
        return requestId;
    }
    
    /**
     * @dev Confirm mint request by custodian
     */
    function confirmMint(uint256 requestId) external onlyRole(CUSTODIAN_ROLE) {
        MintRequest storage request = mintRequests[requestId];
        require(request.timestamp > 0, "Request not found");
        require(!request.executed, "Request already executed");
        require(!mintConfirmations[requestId][msg.sender], "Already confirmed");
        
        mintConfirmations[requestId][msg.sender] = true;
        request.confirmations++;
        
        emit MintConfirmed(requestId, msg.sender, request.confirmations);
        
        // Automatic execution when required confirmations reached
        if (request.confirmations >= requiredConfirmations) {
            _executeMint(requestId);
        }
    }
    
    /**
     * @dev Execute mint request
     */
    function _executeMint(uint256 requestId) internal {
        MintRequest storage request = mintRequests[requestId];
        require(!request.executed, "Already executed");
        require(request.confirmations >= requiredConfirmations, "Insufficient confirmations");
        
        request.executed = true;
        request.approved = true;
        
        _mint(request.recipient, request.amount);
        
        emit MintExecuted(requestId, request.recipient, request.amount);
    }
    
    // === BURN PROCESS ===
    
    /**
     * @dev Request token burning (initiated by merchant)
     */
    function requestBurn(
        address account,
        uint256 amount,
        string memory doichainWithdrawAddress
    ) external onlyRole(MERCHANT_ROLE) whenNotPaused returns (uint256) {
        require(account != address(0), "Invalid account");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(account) >= amount, "Insufficient balance");
        require(bytes(doichainWithdrawAddress).length > 0, "Invalid withdraw address");
        
        uint256 requestId = nextBurnRequestId++;
        
        burnRequests[requestId] = BurnRequest({
            account: account,
            amount: amount,
            doichainWithdrawAddress: doichainWithdrawAddress,
            merchant: msg.sender,
            timestamp: block.timestamp,
            approved: false,
            executed: false,
            confirmations: 0
        });
        
        emit BurnRequested(requestId, account, amount, doichainWithdrawAddress, msg.sender);
        return requestId;
    }
    
    /**
     * @dev Confirm burn request by custodian
     */
    function confirmBurn(uint256 requestId) external onlyRole(CUSTODIAN_ROLE) {
        BurnRequest storage request = burnRequests[requestId];
        require(request.timestamp > 0, "Request not found");
        require(!request.executed, "Request already executed");
        require(!burnConfirmations[requestId][msg.sender], "Already confirmed");
        
        burnConfirmations[requestId][msg.sender] = true;
        request.confirmations++;
        
        emit BurnConfirmed(requestId, msg.sender, request.confirmations);
        
        // Automatic execution when required confirmations reached
        if (request.confirmations >= requiredConfirmations) {
            _executeBurn(requestId);
        }
    }
    
    /**
     * @dev Execute burn request
     */
    function _executeBurn(uint256 requestId) internal {
        BurnRequest storage request = burnRequests[requestId];
        require(!request.executed, "Already executed");
        require(request.confirmations >= requiredConfirmations, "Insufficient confirmations");
        
        request.executed = true;
        request.approved = true;
        
        _burn(request.account, request.amount);
        
        emit BurnExecuted(requestId, request.account, request.amount);
    }
    
    // === PROOF OF RESERVES ===
    
    /**
     * @dev Get reserves information
     */
    function getReservesInfo() external view returns (
        uint256 totalSupplyAmount,
        uint256 totalReservesAmount,
        bool isFullyBacked
    ) {
        totalSupplyAmount = totalSupply();
        totalReservesAmount = totalReserves;
        isFullyBacked = totalReservesAmount >= totalSupplyAmount;
    }
    
    /**
     * @dev Get list of active custodians
     */
    function getCustodianInfo(address custodianAddress) external view returns (
        string memory name,
        string memory doichainAddress,
        uint256 reserveAmount,
        bool active
    ) {
        CustodianInfo memory custodian = custodians[custodianAddress];
        return (
            custodian.name,
            custodian.doichainAddress,
            custodian.reserveAmount,
            custodian.active
        );
    }
    
    // === ADMINISTRATIVE FUNCTIONS ===
    
    /**
     * @dev Change requirement for number of confirmations
     */
    function setRequiredConfirmations(uint256 _requiredConfirmations) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_requiredConfirmations > 0, "Invalid confirmations requirement");
        requiredConfirmations = _requiredConfirmations;
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