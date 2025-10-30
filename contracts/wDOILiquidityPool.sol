// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title wDOILiquidityPool
 * @dev wDOI/ETH liquidity pool for instant trading without conversion requests
 * 
 * Features:
 * - Automated Market Maker (AMM) using x*y=k formula
 * - Instant swap wDOI ↔ ETH
 * - LP tokens for liquidity providers
 * - Trading fees (0.3% standard)
 * - Front-running protection with slippage protection
 */
contract wDOILiquidityPool is ERC20, Ownable, ReentrancyGuard, Pausable {
    
    // wDOI token interface
    IERC20 public immutable wDOI;
    
    // Pool reserves
    uint256 public reserveWDOI;
    uint256 public reserveETH;
    
    // Fees
    uint256 public constant FEE_RATE = 3; // 0.3% = 3/1000
    uint256 public constant FEE_DENOMINATOR = 1000;
    
    // Minimum liquidity to prevent division problems
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;
    
    // Accumulated fees
    uint256 public accumulatedFeesWDOI;
    uint256 public accumulatedFeesETH;
    
    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 wdoiAmount,
        uint256 ethAmount,
        uint256 lpTokens
    );
    
    event LiquidityRemoved(
        address indexed provider,
        uint256 wdoiAmount,
        uint256 ethAmount,
        uint256 lpTokens
    );
    
    event SwapWDOIForETH(
        address indexed user,
        uint256 wdoiIn,
        uint256 ethOut,
        uint256 fee
    );
    
    event SwapETHForWDOI(
        address indexed user,
        uint256 ethIn,
        uint256 wdoiOut,
        uint256 fee
    );
    
    event FeesCollected(
        address indexed collector,
        uint256 wdoiFees,
        uint256 ethFees
    );
    
    event ReservesUpdated(uint256 reserveWDOI, uint256 reserveETH);
    
    constructor(
        address _wDOI,
        address _owner
    ) ERC20("wDOI-ETH LP", "wDOI-LP") Ownable(_owner) {
        require(_wDOI != address(0), "Invalid wDOI address");
        wDOI = IERC20(_wDOI);
    }
    
    // === LIQUIDITY MANAGEMENT ===
    
    /**
     * @dev Add liquidity to pool
     * @param wdoiAmount Amount of wDOI to add
     * @param ethAmount Amount of ETH to add (msg.value)
     * @param minWDOI Minimum amount of wDOI (slippage protection)
     * @param minETH Minimum amount of ETH (slippage protection)
     * @return lpTokens Amount of LP tokens issued
     */
    function addLiquidity(
        uint256 wdoiAmount,
        uint256 ethAmount,
        uint256 minWDOI,
        uint256 minETH
    ) external payable nonReentrant whenNotPaused returns (uint256 lpTokens) {
        require(msg.value == ethAmount, "ETH amount mismatch");
        require(wdoiAmount > 0 && ethAmount > 0, "Amounts must be positive");
        
        // Проверка слиппажа
        require(wdoiAmount >= minWDOI, "wDOI amount too low");
        require(ethAmount >= minETH, "ETH amount too low");
        
        uint256 totalSupplyLP = totalSupply();
        
        if (totalSupplyLP == 0) {
            // First liquidity addition
            lpTokens = sqrt(wdoiAmount * ethAmount) - MINIMUM_LIQUIDITY;
            require(lpTokens > 0, "Insufficient liquidity");
            
            // Minimum liquidity locked forever
            _mint(address(1), MINIMUM_LIQUIDITY);
        } else {
            // Proportional liquidity addition
            uint256 lpFromWDOI = (wdoiAmount * totalSupplyLP) / reserveWDOI;
            uint256 lpFromETH = (ethAmount * totalSupplyLP) / reserveETH;
            
            lpTokens = lpFromWDOI < lpFromETH ? lpFromWDOI : lpFromETH;
            require(lpTokens > 0, "Insufficient liquidity");
            
            // Recalculate actual amounts to maintain ratio
            uint256 actualWDOI = (lpTokens * reserveWDOI) / totalSupplyLP;
            uint256 actualETH = (lpTokens * reserveETH) / totalSupplyLP;
            
            // Return excess
            if (wdoiAmount > actualWDOI) {
                require(
                    wDOI.transfer(msg.sender, wdoiAmount - actualWDOI),
                    "wDOI refund failed"
                );
            }
            
            if (ethAmount > actualETH) {
                payable(msg.sender).transfer(ethAmount - actualETH);
            }
            
            wdoiAmount = actualWDOI;
            ethAmount = actualETH;
        }
        
        // Transfer tokens to pool
        require(
            wDOI.transferFrom(msg.sender, address(this), wdoiAmount),
            "wDOI transfer failed"
        );
        
        // Обновление резервов
        reserveWDOI += wdoiAmount;
        reserveETH += ethAmount;
        
        // Issue LP tokens
        _mint(msg.sender, lpTokens);
        
        emit LiquidityAdded(msg.sender, wdoiAmount, ethAmount, lpTokens);
        emit ReservesUpdated(reserveWDOI, reserveETH);
    }
    
    /**
     * @dev Remove liquidity from pool
     * @param lpTokens Amount of LP tokens to burn
     * @param minWDOI Minimum amount of wDOI to receive
     * @param minETH Minimum amount of ETH to receive
     */
    function removeLiquidity(
        uint256 lpTokens,
        uint256 minWDOI,
        uint256 minETH
    ) external nonReentrant whenNotPaused {
        require(lpTokens > 0, "LP tokens must be positive");
        require(balanceOf(msg.sender) >= lpTokens, "Insufficient LP tokens");
        
        uint256 totalSupplyLP = totalSupply();
        
        // Calculate proportional amounts
        uint256 wdoiAmount = (lpTokens * reserveWDOI) / totalSupplyLP;
        uint256 ethAmount = (lpTokens * reserveETH) / totalSupplyLP;
        
        // Проверка слиппажа
        require(wdoiAmount >= minWDOI, "wDOI amount too low");
        require(ethAmount >= minETH, "ETH amount too low");
        
        // Burn LP tokens
        _burn(msg.sender, lpTokens);
        
        // Обновление резервов
        reserveWDOI -= wdoiAmount;
        reserveETH -= ethAmount;
        
        // Transfer tokens to user
        require(wDOI.transfer(msg.sender, wdoiAmount), "wDOI transfer failed");
        payable(msg.sender).transfer(ethAmount);
        
        emit LiquidityRemoved(msg.sender, wdoiAmount, ethAmount, lpTokens);
        emit ReservesUpdated(reserveWDOI, reserveETH);
    }
    
    // === SWAP OPERATIONS ===
    
    /**
     * @dev Swap wDOI for ETH
     * @param wdoiAmountIn Amount of wDOI to swap
     * @param minETHOut Minimum amount of ETH to receive
     */
    function swapWDOIForETH(
        uint256 wdoiAmountIn,
        uint256 minETHOut
    ) external nonReentrant whenNotPaused {
        require(wdoiAmountIn > 0, "Amount must be positive");
        require(reserveWDOI > 0 && reserveETH > 0, "Insufficient liquidity");
        
        // Calculate output amount with fee
        uint256 ethAmountOut = getAmountOut(wdoiAmountIn, reserveWDOI, reserveETH);
        require(ethAmountOut >= minETHOut, "Insufficient output amount");
        require(ethAmountOut < reserveETH, "Insufficient ETH liquidity");
        
        // Fee in wDOI
        uint256 fee = (wdoiAmountIn * FEE_RATE) / FEE_DENOMINATOR;
        
        // Transfer wDOI from user
        require(
            wDOI.transferFrom(msg.sender, address(this), wdoiAmountIn),
            "wDOI transfer failed"
        );
        
        // Обновление резервов
        reserveWDOI += wdoiAmountIn;
        reserveETH -= ethAmountOut;
        
        // Накопление комиссий
        accumulatedFeesWDOI += fee;
        
        // Transfer ETH to user
        payable(msg.sender).transfer(ethAmountOut);
        
        emit SwapWDOIForETH(msg.sender, wdoiAmountIn, ethAmountOut, fee);
        emit ReservesUpdated(reserveWDOI, reserveETH);
    }
    
    /**
     * @dev Swap ETH for wDOI
     * @param minWDOIOut Minimum amount of wDOI to receive
     */
    function swapETHForWDOI(
        uint256 minWDOIOut
    ) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Amount must be positive");
        require(reserveWDOI > 0 && reserveETH > 0, "Insufficient liquidity");
        
        uint256 ethAmountIn = msg.value;
        
        // Calculate output amount with fee
        uint256 wdoiAmountOut = getAmountOut(ethAmountIn, reserveETH, reserveWDOI);
        require(wdoiAmountOut >= minWDOIOut, "Insufficient output amount");
        require(wdoiAmountOut < reserveWDOI, "Insufficient wDOI liquidity");
        
        // Fee in ETH
        uint256 fee = (ethAmountIn * FEE_RATE) / FEE_DENOMINATOR;
        
        // Обновление резервов
        reserveETH += ethAmountIn;
        reserveWDOI -= wdoiAmountOut;
        
        // Накопление комиссий
        accumulatedFeesETH += fee;
        
        // Transfer wDOI to user
        require(wDOI.transfer(msg.sender, wdoiAmountOut), "wDOI transfer failed");
        
        emit SwapETHForWDOI(msg.sender, ethAmountIn, wdoiAmountOut, fee);
        emit ReservesUpdated(reserveWDOI, reserveETH);
    }
    
    // === HELPER FUNCTIONS ===
    
    /**
     * @dev Calculate output amount using AMM x*y=k formula with fee
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        // Apply fee to input amount
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_RATE);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        
        return numerator / denominator;
    }
    
    /**
     * @dev Calculate required input amount for specific output
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
     * @dev Get current wDOI price in ETH
     */
    function getWDOIPrice() external view returns (uint256) {
        if (reserveWDOI == 0) return 0;
        return (reserveETH * 1e18) / reserveWDOI;
    }
    
    /**
     * @dev Get pool information
     */
    function getPoolInfo() external view returns (
        uint256 _reserveWDOI,
        uint256 _reserveETH,
        uint256 _totalSupply,
        uint256 _wdoiPrice,
        uint256 _accFeesWDOI,
        uint256 _accFeesETH
    ) {
        _reserveWDOI = reserveWDOI;
        _reserveETH = reserveETH;
        _totalSupply = totalSupply();
        _wdoiPrice = reserveWDOI > 0 ? (reserveETH * 1e18) / reserveWDOI : 0;
        _accFeesWDOI = accumulatedFeesWDOI;
        _accFeesETH = accumulatedFeesETH;
    }
    
    // === ADMINISTRATIVE FUNCTIONS ===
    
    /**
     * @dev Collect accumulated fees (owner only)
     */
    function collectFees() external onlyOwner {
        uint256 wdoiFees = accumulatedFeesWDOI;
        uint256 ethFees = accumulatedFeesETH;
        
        if (wdoiFees > 0) {
            accumulatedFeesWDOI = 0;
            require(wDOI.transfer(owner(), wdoiFees), "wDOI fee transfer failed");
        }
        
        if (ethFees > 0) {
            accumulatedFeesETH = 0;
            payable(owner()).transfer(ethFees);
        }
        
        emit FeesCollected(owner(), wdoiFees, ethFees);
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
     * @dev Emergency withdrawal (only when paused)
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 wdoiBalance = wDOI.balanceOf(address(this));
        uint256 ethBalance = address(this).balance;
        
        if (wdoiBalance > 0) {
            require(wDOI.transfer(owner(), wdoiBalance), "Emergency wDOI withdrawal failed");
        }
        
        if (ethBalance > 0) {
            payable(owner()).transfer(ethBalance);
        }
    }
    
    // === MATHEMATICAL FUNCTIONS ===
    
    /**
     * @dev Calculate square root (Babylon algorithm)
     */
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
    
    // Receive ETH
    receive() external payable {
        revert("Use swapETHForWDOI function");
    }
}