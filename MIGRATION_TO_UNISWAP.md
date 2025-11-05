# Migration from Custom DEX to Uniswap Integration

## Current Status
- ✅ Custom wDOIUSDTPool.sol contract deployed
- ✅ Working swap interface
- ✅ Liquidity management

## Migration Plan to Uniswap

### Step 1: Deploy to Uniswap V3
```javascript
// Create wDOI/USDT pool on Uniswap V3
const factory = new ethers.Contract(UNISWAP_V3_FACTORY, factoryAbi, signer);
const pool = await factory.createPool(
  WDOI_ADDRESS,
  USDT_ADDRESS, 
  3000 // 0.3% fee tier
);
```

### Step 2: Migrate Liquidity
```javascript
// Remove liquidity from custom pool
await customPool.removeLiquidity(lpTokens, minWDOI, minUSDT);

// Add to Uniswap V3
await uniswapV3.mint({
  token0: WDOI_ADDRESS,
  token1: USDT_ADDRESS,
  fee: 3000,
  tickLower: -60,
  tickUpper: 60,
  amount0Desired: wdoiAmount,
  amount1Desired: usdtAmount
});
```

### Step 3: Update Frontend
```javascript
// Replace custom swap with Uniswap Router
const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

async function swapThroughUniswap(amountIn, tokenIn, tokenOut) {
  const router = new ethers.Contract(UNISWAP_V3_ROUTER, routerAbi, signer);
  
  await router.exactInputSingle({
    tokenIn: tokenIn,
    tokenOut: tokenOut,
    fee: 3000,
    recipient: userAddress,
    deadline: Math.floor(Date.now() / 1000) + 1800,
    amountIn: amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0
  });
}
```

## Benefits of Uniswap Integration

### For Users
- ✅ Can trade directly in MetaMask Swaps
- ✅ Available on all DEX aggregators (1inch, Paraswap, etc.)
- ✅ Better liquidity discovery
- ✅ Trusted infrastructure

### For Project
- ✅ No need to maintain DEX infrastructure
- ✅ Automatic integration with DeFi ecosystem
- ✅ Focus on core token functionality
- ✅ Reduced smart contract complexity

## Simple Implementation

### Option 1: Uniswap + Simple Website
```
Your Website (Simple)
├── Token information
├── Wrap/Unwrap DOI ↔ wDOI
└── "Trade on Uniswap" button → app.uniswap.org
```

### Option 2: Embedded Uniswap Widget
```html
<!-- Uniswap Widget on your site -->
<iframe 
  src="https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=YOUR_WDOI_ADDRESS"
  width="400" 
  height="600">
</iframe>
```

## MetaMask Swaps Automatic Inclusion

Once on Uniswap with sufficient liquidity:
- Automatically appears in MetaMask → Swaps
- Users can trade without visiting any website
- Just open MetaMask → find wDOI → swap

## Recommendation

**Focus on core functionality:**
1. ✅ DOI ↔ wDOI bridge (your unique value)
2. ✅ Use Uniswap for wDOI ↔ other tokens
3. ✅ Simple website explaining the project
4. ✅ MetaMask integration happens automatically

This approach is much simpler and gives better user experience!