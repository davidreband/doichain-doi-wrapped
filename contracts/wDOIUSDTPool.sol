// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title wDOIUSDTPool
 * @dev Liquidity pool wDOI/USDT for stablecoin trading
 * 
 * Features:
 * - Trade wDOI against USDT
 * - AMM with x*y=k formula
 * - LP tokens for liquidity providers
 * - Trading fees (0.3%)
 * - MetaMask integration via Web3
 */
contract wDOIUSDTPool is ERC20, Ownable, ReentrancyGuard, Pausable {
    
    // Token interfaces
    IERC20 public immutable wDOI;
    IERC20 public immutable USDT;
    
    // Pool reserves
    uint256 public reserveWDOI;
    uint256 public reserveUSDT;
    
    // Fees
    uint256 public constant FEE_RATE = 3; // 0.3% = 3/1000
    uint256 public constant FEE_DENOMINATOR = 1000;
    
    // Minimum liquidity
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;
    
    // Accumulated fees
    uint256 public accumulatedFeesWDOI;
    uint256 public accumulatedFeesUSDT;
    
    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 wdoiAmount,
        uint256 usdtAmount,
        uint256 lpTokens
    );
    
    event LiquidityRemoved(
        address indexed provider,
        uint256 wdoiAmount,
        uint256 usdtAmount,
        uint256 lpTokens
    );
    
    event SwapWDOIForUSDT(
        address indexed user,
        uint256 wdoiIn,
        uint256 usdtOut,
        uint256 fee
    );
    
    event SwapUSDTForWDOI(
        address indexed user,
        uint256 usdtIn,
        uint256 wdoiOut,
        uint256 fee
    );
    
    event FeesCollected(
        address indexed collector,
        uint256 wdoiFees,
        uint256 usdtFees
    );
    
    event ReservesUpdated(uint256 reserveWDOI, uint256 reserveUSDT);
    
    constructor(
        address _wDOI,
        address _usdt,
        address _owner
    ) ERC20("wDOI-USDT LP", "wDOI-USDT-LP") Ownable(_owner) {
        require(_wDOI != address(0), "Invalid wDOI address");
        require(_usdt != address(0), "Invalid USDT address");
        wDOI = IERC20(_wDOI);
        USDT = IERC20(_usdt);
    }
    
    // === LIQUIDITY MANAGEMENT ===
    
    /**
     * @dev Add liquidity to wDOI/USDT pool
     */
    function addLiquidity(
        uint256 wdoiAmount,
        uint256 usdtAmount,
        uint256 minWDOI,
        uint256 minUSDT
    ) external nonReentrant whenNotPaused returns (uint256 lpTokens) {
        require(wdoiAmount > 0 && usdtAmount > 0, "Amounts must be positive");
        require(wdoiAmount >= minWDOI, "wDOI amount too low");
        require(usdtAmount >= minUSDT, "USDT amount too low");
        
        uint256 totalSupplyLP = totalSupply();
        
        if (totalSupplyLP == 0) {
            // First liquidity addition
            lpTokens = sqrt(wdoiAmount * usdtAmount) - MINIMUM_LIQUIDITY;
            require(lpTokens > 0, "Insufficient liquidity");
            
            // Minimum liquidity locked forever
            _mint(address(1), MINIMUM_LIQUIDITY);
        } else {
            // Proportional liquidity addition
            uint256 lpFromWDOI = (wdoiAmount * totalSupplyLP) / reserveWDOI;
            uint256 lpFromUSDT = (usdtAmount * totalSupplyLP) / reserveUSDT;
            
            lpTokens = lpFromWDOI < lpFromUSDT ? lpFromWDOI : lpFromUSDT;
            require(lpTokens > 0, "Insufficient liquidity");
            
            // Recalculate actual amounts to maintain ratio
            uint256 actualWDOI = (lpTokens * reserveWDOI) / totalSupplyLP;
            uint256 actualUSDT = (lpTokens * reserveUSDT) / totalSupplyLP;
            
            // Return excess tokens
            if (wdoiAmount > actualWDOI) {
                require(
                    wDOI.transfer(msg.sender, wdoiAmount - actualWDOI),
                    "wDOI refund failed"
                );
            }
            
            if (usdtAmount > actualUSDT) {
                require(
                    USDT.transfer(msg.sender, usdtAmount - actualUSDT),
                    "USDT refund failed"
                );
            }
            
            wdoiAmount = actualWDOI;
            usdtAmount = actualUSDT;
        }
        
        // Transfer tokens to pool
        require(
            wDOI.transferFrom(msg.sender, address(this), wdoiAmount),
            "wDOI transfer failed"
        );
        require(
            USDT.transferFrom(msg.sender, address(this), usdtAmount),
            "USDT transfer failed"
        );
        
        // Update reserves
        reserveWDOI += wdoiAmount;
        reserveUSDT += usdtAmount;
        
        // Mint LP tokens
        _mint(msg.sender, lpTokens);
        
        emit LiquidityAdded(msg.sender, wdoiAmount, usdtAmount, lpTokens);
        emit ReservesUpdated(reserveWDOI, reserveUSDT);
    }
    
    /**
     * @dev Remove liquidity from pool
     */
    function removeLiquidity(
        uint256 lpTokens,
        uint256 minWDOI,
        uint256 minUSDT
    ) external nonReentrant whenNotPaused {
        require(lpTokens > 0, "LP tokens must be positive");
        require(balanceOf(msg.sender) >= lpTokens, "Insufficient LP tokens");
        
        uint256 totalSupplyLP = totalSupply();
        
        // Calculate proportional amounts
        uint256 wdoiAmount = (lpTokens * reserveWDOI) / totalSupplyLP;
        uint256 usdtAmount = (lpTokens * reserveUSDT) / totalSupplyLP;
        
        // Check slippage protection
        require(wdoiAmount >= minWDOI, "wDOI amount too low");
        require(usdtAmount >= minUSDT, "USDT amount too low");
        
        // Burn LP tokens
        _burn(msg.sender, lpTokens);
        
        // Update reserves
        reserveWDOI -= wdoiAmount;
        reserveUSDT -= usdtAmount;
        
        // Transfer tokens to user
        require(wDOI.transfer(msg.sender, wdoiAmount), "wDOI transfer failed");
        require(USDT.transfer(msg.sender, usdtAmount), "USDT transfer failed");
        
        emit LiquidityRemoved(msg.sender, wdoiAmount, usdtAmount, lpTokens);
        emit ReservesUpdated(reserveWDOI, reserveUSDT);
    }
    
    // === SWAP OPERATIONS ===
    
    /**
     * @dev Swap wDOI for USDT
     */
    function swapWDOIForUSDT(
        uint256 wdoiAmountIn,
        uint256 minUSDTOut
    ) external nonReentrant whenNotPaused {
        require(wdoiAmountIn > 0, "Amount must be positive");
        require(reserveWDOI > 0 && reserveUSDT > 0, "Insufficient liquidity");
        
        // Calculate output amount with fee
        uint256 usdtAmountOut = getAmountOut(wdoiAmountIn, reserveWDOI, reserveUSDT);
        require(usdtAmountOut >= minUSDTOut, "Insufficient output amount");
        require(usdtAmountOut < reserveUSDT, "Insufficient USDT liquidity");
        
        // Fee in wDOI
        uint256 fee = (wdoiAmountIn * FEE_RATE) / FEE_DENOMINATOR;
        
        // Transfer wDOI from user
        require(
            wDOI.transferFrom(msg.sender, address(this), wdoiAmountIn),
            "wDOI transfer failed"
        );
        
        // Update reserves
        reserveWDOI += wdoiAmountIn;
        reserveUSDT -= usdtAmountOut;
        
        // Accumulate fees
        accumulatedFeesWDOI += fee;
        
        // Transfer USDT to user
        require(USDT.transfer(msg.sender, usdtAmountOut), "USDT transfer failed");
        
        emit SwapWDOIForUSDT(msg.sender, wdoiAmountIn, usdtAmountOut, fee);
        emit ReservesUpdated(reserveWDOI, reserveUSDT);
    }
    
    /**
     * @dev Swap USDT for wDOI
     */
    function swapUSDTForWDOI(
        uint256 usdtAmountIn,
        uint256 minWDOIOut
    ) external nonReentrant whenNotPaused {
        require(usdtAmountIn > 0, "Amount must be positive");
        require(reserveWDOI > 0 && reserveUSDT > 0, "Insufficient liquidity");
        
        // Calculate output amount with fee
        uint256 wdoiAmountOut = getAmountOut(usdtAmountIn, reserveUSDT, reserveWDOI);
        require(wdoiAmountOut >= minWDOIOut, "Insufficient output amount");
        require(wdoiAmountOut < reserveWDOI, "Insufficient wDOI liquidity");
        
        // Fee in USDT
        uint256 fee = (usdtAmountIn * FEE_RATE) / FEE_DENOMINATOR;
        
        // Transfer USDT from user
        require(
            USDT.transferFrom(msg.sender, address(this), usdtAmountIn),
            "USDT transfer failed"
        );
        
        // Update reserves
        reserveUSDT += usdtAmountIn;
        reserveWDOI -= wdoiAmountOut;
        
        // Accumulate fees
        accumulatedFeesUSDT += fee;
        
        // Transfer wDOI to user
        require(wDOI.transfer(msg.sender, wdoiAmountOut), "wDOI transfer failed");
        
        emit SwapUSDTForWDOI(msg.sender, usdtAmountIn, wdoiAmountOut, fee);
        emit ReservesUpdated(reserveWDOI, reserveUSDT);
    }
    
    // === HELPER FUNCTIONS ===
    
    /**
     * @dev Calculate output amount using AMM formula
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_RATE);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        
        return numerator / denominator;
    }
    
    /**
     * @dev Calculate required input amount
     */
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256) {
        require(amountOut > 0, "Insufficient output amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        require(amountOut < reserveOut, "Insufficient liquidity");
        
        uint256 numerator = (reserveIn * amountOut) * FEE_DENOMINATOR;
        uint256 denominator = (reserveOut - amountOut) * (FEE_DENOMINATOR - FEE_RATE);
        
        return (numerator / denominator) + 1;
    }
    
    /**
     * @dev Get current wDOI price in USDT
     */
    function getWDOIPrice() external view returns (uint256) {
        if (reserveWDOI == 0) return 0;
        return (reserveUSDT * 1e18) / reserveWDOI;
    }
    
    /**
     * @dev Get pool information
     */
    function getPoolInfo() external view returns (
        uint256 _reserveWDOI,
        uint256 _reserveUSDT,
        uint256 _totalSupply,
        uint256 _wdoiPrice,
        uint256 _accFeesWDOI,
        uint256 _accFeesUSDT
    ) {
        _reserveWDOI = reserveWDOI;
        _reserveUSDT = reserveUSDT;
        _totalSupply = totalSupply();
        _wdoiPrice = reserveWDOI > 0 ? (reserveUSDT * 1e18) / reserveWDOI : 0;
        _accFeesWDOI = accumulatedFeesWDOI;
        _accFeesUSDT = accumulatedFeesUSDT;
    }
    
    // === ADMINISTRATIVE FUNCTIONS ===
    
    /**
     * @dev Collect accumulated fees
     */
    function collectFees() external onlyOwner {
        uint256 wdoiFees = accumulatedFeesWDOI;
        uint256 usdtFees = accumulatedFeesUSDT;
        
        if (wdoiFees > 0) {
            accumulatedFeesWDOI = 0;
            require(wDOI.transfer(owner(), wdoiFees), "wDOI fee transfer failed");
        }
        
        if (usdtFees > 0) {
            accumulatedFeesUSDT = 0;
            require(USDT.transfer(owner(), usdtFees), "USDT fee transfer failed");
        }
        
        emit FeesCollected(owner(), wdoiFees, usdtFees);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 wdoiBalance = wDOI.balanceOf(address(this));
        uint256 usdtBalance = USDT.balanceOf(address(this));
        
        if (wdoiBalance > 0) {
            require(wDOI.transfer(owner(), wdoiBalance), "Emergency wDOI withdrawal failed");
        }
        
        if (usdtBalance > 0) {
            require(USDT.transfer(owner(), usdtBalance), "Emergency USDT withdrawal failed");
        }
    }
    
    // === MATHEMATICAL FUNCTIONS ===
    
    /**
     * @dev Calculate square root
     */
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}